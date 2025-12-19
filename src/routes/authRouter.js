const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Public Routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// Protected Routes
// Any route defined AFTER this line will require a valid Access Token
router.use(authController.protect);

router.get('/me', authController.getMe);
router.patch('/updateMyPassword', authController.updatePassword);

module.exports = router;