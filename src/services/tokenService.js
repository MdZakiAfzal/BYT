const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

if (!JWT_SECRET) {
  // Fail fast in development if secret missing
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production env');
  } else {
    console.warn('Warning: JWT_SECRET not set. Using a fallback insecure secret for dev only.');
  }
}

function signAccessToken(userId, sessionId = null, extra = {}) {
  const payload = {
    sub: userId.toString(),
    ...(sessionId ? { sid: sessionId } : {}),
    ...extra,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function generateSessionId() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return crypto.randomBytes(16).toString('hex'); // 32 hex chars
}

function generateRandomToken(byteLength = 48) {
  return crypto.randomBytes(byteLength).toString('hex'); // default 96 hex chars
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  generateSessionId,
  generateRandomToken,
};
