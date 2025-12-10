const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/userModel');
const plans = require('../config/plans');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.createCheckoutSession = catchAsync(async (req, res, next) => {
  const { planId } = req.body; // e.g., 'starter' or 'pro'

  // 1. Validate the plan exists
  const selectedPlan = plans[planId];
  if (!selectedPlan) {
    return next(new AppError('Invalid plan selected', 400));
  }

  if (planId === 'free') {
    return next(new AppError('Free plan does not need payment', 400));
  }

  // 2. Get the user (req.user is set by authController.protect)
  const user = req.user;

  // 3. Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    customer_email: user.email, // Auto-fill user email on Stripe
    line_items: [
      {
        price: selectedPlan.stripePriceId,
        quantity: 1,
      },
    ],
    // These metadata fields are CRITICAL for the Webhook later
    metadata: {
      userId: user._id.toString(),
      planId: planId,
    },
    // Where to redirect after success/cancel
    success_url: `${process.env.FRONTEND_URL}/dashboard?success=true`,
    cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
  });

  // 4. Send the URL to the frontend
  res.status(200).json({
    status: 'success',
    url: session.url, // Frontend will redirect window.location to this URL
  });
});