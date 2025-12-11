const plans = {
    free: {
        name: 'Free',
        price: 0,
        monthlyQuota: 3, // 3 videos per month
        stripePriceId: null,
        features: {
            model: 'gemini-1.5-flash', // Cheaper/Faster model
            blogLength: 'short',
            seoOptimization: false,
            exportFormats: ['txt']
        }
    },
    starter: {
        name: 'Starter',
        price: 29,
        monthlyQuota: 30,
        stripePriceId: 'price_1ScmQK4AZ13rdecNERIaiuQW',
        features: {
            model: 'gemini-1.5-flash',
            blogLength: 'standard',
            seoOptimization: true, // Basic SEO
            exportFormats: ['txt', 'md']
        }
    },
    pro: {
        name: 'Pro',
        price: 49,
        monthlyQuota: 100,
        stripePriceId: 'price_1ScmSa4AZ13rdecNHgBjL68G',
        features: {
            model: 'gemini-1.5-pro', // Smarter model
            blogLength: 'long',
            seoOptimization: true,
            exportFormats: ['txt', 'md', 'html']
        }
    },
    agency: {
        name: 'Agency',
        price: 99,
        monthlyQuota: 300,
        stripePriceId: 'price_1ScmTD4AZ13rdecNoNkGr3q7',
        features: {
            model: 'gemini-1.5-pro',
            blogLength: 'long',
            seoOptimization: true,
            exportFormats: ['txt', 'md', 'html', 'json']
        }
    }
};

module.exports = plans;