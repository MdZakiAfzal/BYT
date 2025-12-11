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

  const session = event.data.object;

  // ---------------------------------------------------------
  // EVENT 1: New Subscription Created (Checkout Success)
  // ---------------------------------------------------------
  if (event.type === 'checkout.session.completed') {
    // We rely on the metadata we passed during checkout creation
    const userId = session.metadata.userId;
    const planId = session.metadata.planId;
    const subscriptionId = session.subscription;

    console.log(`💰 New Subscription: User ${userId} -> ${planId}`);

    // Update User: Set new plan, save subscription ID, reset quota
    await User.findByIdAndUpdate(userId, {
      plan: planId,
      subscriptionId: subscriptionId,
      monthlyQuotaUsed: 0,
      quotaResetAt: new Date()
    });
  }

  // ---------------------------------------------------------
  // EVENT 2: Subscription Cancelled (Downgrade to Free)
  // ---------------------------------------------------------
  else if (event.type === 'customer.subscription.deleted') {
    // For this event, the 'session' object is actually the Subscription object
    const subscriptionId = session.id;
    
    console.log(`❌ Subscription Cancelled: ${subscriptionId}`);

    // Find the user who owns this subscription and downgrade them
    const user = await User.findOneAndUpdate(
      { subscriptionId: subscriptionId },
      { 
        plan: 'free', 
        subscriptionId: null,
        monthlyQuotaUsed: 0 
      }
    );

    if (!user) {
        console.log(`⚠️ User not found for cancelled sub: ${subscriptionId}`);
    }
  }

  // ---------------------------------------------------------
  // EVENT 3: Monthly Renewal Payment Success
  // ---------------------------------------------------------
  else if (event.type === 'invoice.payment_succeeded') {
    // This runs every month when Stripe automatically charges the card
    const subscriptionId = session.subscription;

    // We only care if it's linked to a subscription
    if (subscriptionId) {
        console.log(`✅ Recurring Payment Success: ${subscriptionId}`);
        
        // Find user by subscription ID and reset their monthly usage
        await User.findOneAndUpdate(
        { subscriptionId: subscriptionId },
        { 
            monthlyQuotaUsed: 0,
            quotaResetAt: new Date()
        }
        );
    }
  }

  // 3. Return a 200 response to acknowledge receipt of the event
  res.send();
};

/* Test command for stripe CLI
 ./stripe listen --forward-to localhost:4000/api/v1/webhook/stripe
*/