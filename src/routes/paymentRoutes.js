const express = require('express');
const paymentController = require('../controllers/paymentController');
const authController = require('../controllers/authController');

const router = express.Router();

// All payment routes need the user to be logged in
router.use(authController.protect);

// POST /api/v1/payment/checkout-session
router.post('/checkout-session', paymentController.createCheckoutSession);

module.exports = router;