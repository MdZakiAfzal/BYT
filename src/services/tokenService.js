const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'dev-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';


/**
 * Generates a pair of tokens (Access + Refresh)
 * @param {string} userId - The User's ID
 * @returns {Object} { accessToken, refreshToken }
 */
exports.generateTokens = (userId) => {
    const payload = { sub: userId };

    const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });

    return { accessToken, refreshToken };
};

// Verifies the short-lived Access Token
exports.verifyAccessToken = (token) => {
    return jwt.verify(token, ACCESS_SECRET);
};

// Verifies the long-lived Refresh Token
exports.verifyRefreshToken = (token) => {
    return jwt.verify(token, REFRESH_SECRET);
};

// Generates a random token (useful for email verification/reset password later)
exports.generateRandomToken = (byteLength = 32) => {
    return crypto.randomBytes(byteLength).toString('hex');
};