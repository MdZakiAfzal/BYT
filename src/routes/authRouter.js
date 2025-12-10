const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Public Routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

// Protected Routes
// Any route defined AFTER this line will require a valid Access Token
router.use(authController.protect);

router.get('/me', authController.getMe);

module.exports = router;