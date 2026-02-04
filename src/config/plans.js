const plans = {
  free: {
    name: 'Free',
    price: 0,
    monthlyQuota: 3,
    whisperQuota: 1,
    maxDuration: 15,
    stripePriceId: null,
    features: { 
        model: 'gemini-2.5-flash', // Fast & Cheap
        allowedLengths: ['short', 'medium'], 
        seoOptimization: false, 
        
        // Feature Gates
        toneControls: false,
        allowImageGen: false,  // ❌ No AI Images
        imageQuota: 0,
        allowEditor: true,     // ✅ Editor is a hook
        removeWatermark: false,
        chatAssistant: false,
        teamSeats: 1
    }
  },
  starter: {
    name: 'Starter',
    price: 9,
    monthlyQuota: 15,
    whisperQuota: 5,
    maxDuration: 30,
    stripePriceId: 'price_1ScmQK4AZ13rdecNERIaiuQW',
    features: {
      model: 'gemini-2.5-flash',
      allowedLengths: ['short', 'medium'],
      seoOptimization: true,
      toneControls: true,
      allowImageGen: true,    // ✅ 5 AI Images
      imageQuota: 5,
      allowEditor: true,
      removeWatermark: true,
      chatAssistant: true,    // ✅ AI Co-Pilot Enabled
      teamSeats: 1
    }
  },
  pro: {
    name: 'Pro',
    price: 19,
    monthlyQuota: 50,
    whisperQuota: 15,
    maxDuration: 60,
    stripePriceId: 'price_1ScmSa4AZ13rdecNHgBjL68G',
    features: {
      model: 'gemini-2.5-flash', // Or upgrade to 'gemini-1.5-pro' if you want better quality
      allowedLengths: ['short', 'medium', 'long'],
      seoOptimization: true,
      toneControls: true,
      allowImageGen: true,
      imageQuota: 20,
      allowEditor: true,
      removeWatermark: true,
      chatAssistant: true,
      teamSeats: 1
    }
  },
  agency: {
    name: 'Agency',
    price: 49,
    monthlyQuota: 150,
    whisperQuota: 50,
    maxDuration: 120,
    stripePriceId: 'price_1ScmTD4AZ13rdecNoNkGr3q7', 
    features: {
      model: 'gemini-2.5-flash',
      allowedLengths: ['short', 'medium', 'long', 'deep-dive'],
      seoOptimization: true,
      toneControls: true,
      allowImageGen: true,
      imageQuota: 100,
      allowEditor: true,
      removeWatermark: true,
      chatAssistant: true,
      teamSeats: 5 // ✅ Multi-user license implied
    }
  }
};

module.exports = plans;