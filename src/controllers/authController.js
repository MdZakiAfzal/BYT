const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const tokenService = require('../services/tokenService');

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