const plans = {
  free: {
    name: 'Free',
    price: 0,
    monthlyQuota: 3,
    whisperQuota: 0,
    maxDuration: 15,
    stripePriceId: null,
    features: { 
        model: 'gemini-2.5-flash', // Fast & Cheap
        allowedLengths: ['short', 'medium', 'long'], 
        seoOptimization: false, 
        exportFormats: ['txt', 'md'],
        
        // Feature Gates
        toneControls: false,
        viralHooks: false,
        smartVisuals: false,
        chatAssistant: false,
        teamSeats: 1
    }
  },
  starter: {
    name: 'Starter',
    price: 29,
    monthlyQuota: 50,
    whisperQuota: 3,
    maxDuration: 30,
    stripePriceId: 'price_1ScmQK4AZ13rdecNERIaiuQW',
    features: { 
        model: 'gemini-2.5-flash', // Fast & Cheap
        allowedLengths: ['short', 'medium', 'long'], 
        seoOptimization: true, 
        exportFormats: ['txt', 'md', 'html'],
        
        // Feature Gates
        toneControls: true,
        viralHooks: true,
        smartVisuals: true,
        chatAssistant: false,
        teamSeats: 1
    }
  },
  pro: {
    name: 'Pro',
    price: 49,
    monthlyQuota: 150,
    whisperQuota: 15,
    maxDuration: 60,
    stripePriceId: 'price_1ScmSa4AZ13rdecNHgBjL68G',
    features: { 
        model: 'gemini-2.5-flash', // 🧠 SMARTER Model
        allowedLengths: ['short', 'medium', 'long', 'deep-dive'], 
        seoOptimization: true, 
        exportFormats: ['txt', 'md', 'html'],
        
        // Feature Gates
        toneControls: true,
        viralHooks: true,
        smartVisuals: true,
        chatAssistant: true, // ✅ The Editor
        teamSeats: 1
    }
  },
  agency: {
    name: 'Agency',
    price: 99,
    monthlyQuota: 500,
    whisperQuota: 50,
    maxDuration: 180,
    stripePriceId: 'price_1ScmTD4AZ13rdecNoNkGr3q7', 
    features: { 
        model: 'gemini-2.5-flash', // 🧠 SMARTER Model
        allowedLengths: ['short', 'medium', 'long', 'deep-dive'], 
        seoOptimization: true, 
        exportFormats: ['txt', 'md', 'html'], // JSON removed
        
        // Feature Gates
        toneControls: true,
        viralHooks: true,
        smartVisuals: true,
        chatAssistant: true,
        teamSeats: 5
    }
  }
};

module.exports = plans;