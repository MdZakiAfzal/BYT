const plans = {
    free: {
        name: 'Free',
        price: 0,
        monthlyQuota: 3, // 3 videos per month
        stripePriceId: null
    },
    starter: {
        name: 'Starter',
        price: 29,
        monthlyQuota: 30,
        stripePriceId: 'price_1ScmQK4AZ13rdecNERIaiuQW' 
    },
    pro: {
        name: 'Pro',
        price: 49,
        monthlyQuota: 100,
        stripePriceId: 'price_1ScmSa4AZ13rdecNHgBjL68G'
    },
    agency: {
        name: 'Agency',
        price: 99,
        monthlyQuota: 300,
        stripePriceId: 'price_1ScmTD4AZ13rdecNoNkGr3q7'
    }
};

module.exports = plans;