const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require(`../models/userModel`);
const catchAsync = require(`../utils/catchAsync`);
const AppError = require(`../utils/AppError`);
const { promisify } = require('util');

// helper to create token
const signToken = (id, sessionId) => {
    return jwt.sign({ id, session: sessionId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

// send token + user
const createSendToken = async (userDoc, statusCode, res) => {
    const sessionId = userDoc.currentSession;
    const token = signToken(userDoc._id, sessionId);

    // Convert to plain object and remove sensitive fields
    const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
    delete user.password;
    delete user.__v;
    delete user.currentSession;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: { user }
    });
};

// Create User
exports.createUser = catchAsync(async (req, res, next) => {
    const { name, email, password, confirmPassword } = req.body;
    const newUser = await User.create({
        name,
        email,
        password,
        confirmPassword
    });

    return createSendToken(newUser, 201, res);
});

// Login
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1. check email & password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }

    // 2. find user & include password
    const user = await User.findOne({ email }).select('+password +currentSession');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    // 3. create a new session id and store it on the user to enforce single device
    const sessionId = crypto.randomBytes(16).toString('hex');
    user.currentSession = sessionId;
    // save without running full validation (safe if no schema changes needed)
    await user.save({ validateBeforeSave: false });

    // 4. send token
    await createSendToken(user, 200, res);
});

// protect routes
exports.protect = catchAsync(async (req, res, next) => {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const parts = authHeader.split(' ');
        if (parts.length === 2) token = parts[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in. Please login to get access to this route', 401));
    }

    // verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // find user
    const currentUser = await User.findById(decoded.id).select('+password +currentSession');
    if (!currentUser) {
        return next(new AppError('User no longer exists', 401));
    }

    // check that session in token matches the server-side current session
    if (!decoded.session || currentUser.currentSession !== decoded.session) {
      return next(new AppError('Session invalid or expired (login detected from another device)', 401));
    }

    //check whether the user has chaneged their password currently and someone's trying to login with previous token
    if(currentUser.passwordChangedAfter(decoded.iat)){
        return next(new AppError('User has changed their password recently. Please login again', 401));
    };

    req.user = currentUser;
    next();
});