const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/userModel');
const plans = require('../config/plans');

exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // 1. Verify the event came from Stripe (Security)
    // We use the raw body (req.body) which must be a Buffer here
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`⚠️  Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 2. Handle the specific event
  if (event.type === 'checkout.session.completed' || event.type === 'invoice.payment_succeeded') {
    const session = event.data.object;
    
    // We stored userId and planId in metadata during checkout creation!
    // Note: invoice.payment_succeeded might not have metadata directly on the session object 
    // depending on how it was created, but usually for subscriptions, 
    // we rely on checkout.session.completed for the first one.
    
    // For renewals (invoice.payment_succeeded), we might need to look up the user by customerId or subscriptionId.
    // Let's handle the MAIN flow: Checkout Completed.
    if(event.type === 'checkout.session.completed') {
        const userId = session.metadata.userId;
        const planId = session.metadata.planId;
        const subscriptionId = session.subscription; // Stripe Subscription ID

        console.log(`💰 Payment success for user: ${userId}, plan: ${planId}`);

        // 3. Update User in DB
        const planDetails = plans[planId];
        
        await User.findByIdAndUpdate(userId, {
            plan: planId,
            subscriptionId: subscriptionId,
            monthlyQuotaUsed: 0, // Reset usage on upgrade
            quotaResetAt: new Date()
        });
    }
  }

  // 3. Return a 200 response to acknowledge receipt of the event
  res.send();
};