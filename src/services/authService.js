const User = require('../models/userModel');
const tokenService = require('./tokenService');
const AppError = require('../utils/AppError');

/**
 * Register a new user
 */
exports.register = async (userData) => {
    // 1. Create User
    const newUser = await User.create(userData);

    // 2. Generate Tokens
    const { accessToken, refreshToken } = tokenService.generateTokens(newUser._id);

    // 3. Save Refresh Token to DB (Initialize array)
    newUser.refreshTokens = [{ token: refreshToken }];
    await newUser.save({ validateBeforeSave: false });

    // 4. Return user (without sensitive data) & tokens
    const userObj = newUser.toObject();
    delete userObj.password;
    delete userObj.refreshTokens;
    delete userObj.__v;

    return { user: userObj, accessToken, refreshToken };
};

/**
 * Login user
 */
exports.login = async (email, password) => {
    // 1. Check if user exists & password is correct
    const user = await User.findOne({ email }).select('+password +refreshTokens');
    
    if (!user || !(await user.correctPassword(password, user.password))) {
        throw new AppError('Incorrect email or password', 401);
    }

    // 2. Generate Tokens
    const { accessToken, refreshToken } = tokenService.generateTokens(user._id);

    // 3. Manage Refresh Tokens (Limit to 3 devices)
    let newRefreshTokens = user.refreshTokens || [];
    
    // Remove oldest if we have too many
    if (newRefreshTokens.length >= 3) {
        newRefreshTokens.shift(); 
    }
    
    // Add new token
    newRefreshTokens.push({ token: refreshToken });
    user.refreshTokens = newRefreshTokens;

    await user.save({ validateBeforeSave: false });

    // 4. Return
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshTokens;
    delete userObj.__v;

    return { user: userObj, accessToken, refreshToken };
};

/**
 * Refresh Access Token
 */
exports.refreshTokens = async (incomingRefreshToken) => {
    // 1. Verify Incoming Token
    let decoded;
    try {
        decoded = tokenService.verifyRefreshToken(incomingRefreshToken);
    } catch (err) {
        throw new AppError('Invalid or expired refresh token', 401);
    }

    // 2. Find User
    const user = await User.findById(decoded.sub).select('+refreshTokens');
    if (!user) throw new AppError('User no longer exists', 401);

    // 3. Check if token is in the allowed list
    const tokenExists = user.refreshTokens.find(rt => rt.token === incomingRefreshToken);
    
    if (!tokenExists) {
        // SECURITY: Token reuse detected! Someone is using an old token.
        // Option: Invalidate ALL tokens to force re-login for safety.
        user.refreshTokens = [];
        await user.save({ validateBeforeSave: false });
        throw new AppError('Invalid refresh token (Reuse detected). Please login again.', 401);
    }

    // 4. Rotate Token (Delete old, Add new)
    const { accessToken, refreshToken: newRefreshToken } = tokenService.generateTokens(user._id);
    
    // Filter out the old token being used now
    const newTokensArray = user.refreshTokens.filter(rt => rt.token !== incomingRefreshToken);
    
    // Add the new one
    newTokensArray.push({ token: newRefreshToken });
    
    user.refreshTokens = newTokensArray;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken: newRefreshToken };
};

/**
 * Logout (Remove specific token)
 */
exports.logout = async (refreshToken) => {
    // We don't verify strict validity here, just remove if it exists
    // But we might need to decode to find the user ID if not passed in context.
    // For simplicity, we usually assume the user is protected/authorized or we decode safely.
    
    try {
        const decoded = tokenService.verifyRefreshToken(refreshToken);
        const user = await User.findById(decoded.sub).select('+refreshTokens');
        if (!user) return; // Already gone

        // Remove the token
        user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
        await user.save({ validateBeforeSave: false });
    } catch (err) {
        // If token invalid, just ignore
    }
};