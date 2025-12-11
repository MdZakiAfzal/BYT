const express = require('express');
const paymentController = require('../controllers/paymentController');
const authController = require('../controllers/authController');

const router = express.Router();

// Public Route
router.get('/plans', paymentController.getAllPlans);

// Protected Routes
router.use(authController.protect);
router.post('/checkout-session', paymentController.createCheckoutSession);

module.exports = router;