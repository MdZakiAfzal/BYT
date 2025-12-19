const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const tokenService = require('../services/tokenService');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

// 1. Register User
exports.register = catchAsync(async (req, res, next) => {
    const { name, email, password, confirmPassword } = req.body;

    // Call Service
    const { user, accessToken, refreshToken } = await authService.register({
        name,
        email,
        password,
        confirmPassword
    });

    // Send Response
    res.status(201).json({
        status: 'success',
        tokens: { accessToken, refreshToken },
        data: { user }
    });
});

// 2. Login User
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }

    const { user, accessToken, refreshToken } = await authService.login(email, password);

    res.status(200).json({
        status: 'success',
        tokens: { accessToken, refreshToken },
        data: { user }
    });
});

// 3. Refresh Token (Get new Access Token)
exports.refreshToken = catchAsync(async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return next(new AppError('Refresh token is required', 400));
    }

    const tokens = await authService.refreshTokens(refreshToken);

    res.status(200).json({
        status: 'success',
        tokens // Contains new accessToken & new refreshToken
    });
});

// 4. Logout
exports.logout = catchAsync(async (req, res, next) => {
    const { refreshToken } = req.body;
    
    // We try to remove it, but we don't error out if it's already gone/invalid
    // Logic is handled in service
    if (refreshToken) {
        await authService.logout(refreshToken);
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// 5. Protect Middleware (Guard routes)
exports.protect = catchAsync(async (req, res, next) => {
    // A) Get token from header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in. Please login to get access.', 401));
    }

    // B) Verify Access Token Signature
    // We use the tokenService or manual jwt.verify
    const decoded = tokenService.verifyAccessToken(token);

    // C) Check if user still exists
    // This is critical: if a user is deleted, their token should stop working
    const currentUser = await User.findById(decoded.sub);
    if (!currentUser) {
        return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // D) Check if user changed password after the token was issued
    if (currentUser.passwordChangedAfter(decoded.iat)) {
        return next(new AppError('User recently changed password! Please log in again.', 401));
    }

    // GRANT ACCESS
    req.user = currentUser;
    next();
});

// get me
exports.getMe = (req, res, next) => {
    // req.user is set by the 'protect' middleware
    res.status(200).json({
        status: 'success',
        data: {
            user: req.user
        }
    });
};

// Forgot Password (User sends email, we send link)
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get user by email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }

  // 2. Generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. Send it to user's email
  const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your Password Reset Token (Valid for 10 min)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email! (Check your console logs)'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('There was an error sending the email. Try again later!'), 500);
  }
});

// 👇 7. Reset Password (User clicks link, provides new password)
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() } // Token must be valid (time > now)
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // 2. Set new password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  
  // Clear reset fields
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  
  await user.save(); // Pre-save hook will hash the password

  // 3. Log the user in immediately (send new tokens)
  const { accessToken, refreshToken } = tokenService.generateTokens(user._id);

  // Initialize refresh tokens if needed
  user.refreshTokens = [{ token: refreshToken }];
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    tokens: { accessToken, refreshToken },
    data: { user }
  });
});

// 👇 8. Update Password (Logged in user wants to change PW)
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2. Check if current password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  // 3. Update password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();
 
  // 4. Send new tokens
  const { accessToken, refreshToken } =tokenService.generateTokens(user._id);
  user.refreshTokens = [{ token: refreshToken }];
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    tokens: { accessToken, refreshToken },
    data: { user }
  });
});