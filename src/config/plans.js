const plans = {
  free: {
    name: 'Free',
    price: 0,
    monthlyQuota: 3,        // Total videos/month
    whisperQuota: 0,        // ❌ No expensive audio transcription
    maxDuration: 15,        // Max 15 mins per video
    stripePriceId: null,
    features: { 
        model: 'gemini-2.5-flash', 
        blogLength: 'short', 
        seoOptimization: false, 
        exportFormats: ['txt'] 
    }
  },
  starter: {
    name: 'Starter',
    price: 29,
    monthlyQuota: 50,       // ✅ Generous (was 30)
    whisperQuota: 3,        // 3 "Emergency" videos (if no captions found)
    maxDuration: 20,        // Max 20 mins
    stripePriceId: 'price_1ScmQK4AZ13rdecNERIaiuQW',
    features: { 
        model: 'gemini-2.5-flash', 
        blogLength: 'standard', 
        seoOptimization: true, 
        exportFormats: ['txt', 'md'] 
    }
  },
  pro: {
    name: 'Pro',
    price: 49,
    monthlyQuota: 150,      // ✅ Very Generous (was 100)
    whisperQuota: 15,       // 15 Emergency videos
    maxDuration: 60,        // Max 1 hour
    stripePriceId: 'price_1ScmSa4AZ13rdecNHgBjL68G',
    features: { 
        model: 'gemini-2.5-pro', 
        blogLength: 'long', 
        seoOptimization: true, 
        exportFormats: ['txt', 'md', 'html'] 
    }
  },
  agency: {
    name: 'Agency',
    price: 99,
    monthlyQuota: 500,      // ✅ Massive Value (was 300)
    whisperQuota: 50,       // 50 Emergency videos
    maxDuration: 120,       // Max 2 hours
    stripePriceId: 'price_1ScmTD4AZ13rdecNoNkGr3q7',
    features: { 
        model: 'gemini-2.5-pro', 
        blogLength: 'long', 
        seoOptimization: true, 
        exportFormats: ['txt', 'md', 'html', 'json'] 
    }
  }
};

module.exports = plans;