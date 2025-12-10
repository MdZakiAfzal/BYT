require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/userModel');

const seedAdmin = async () => {
  try {
    // 1. Connect to DB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📦 Connected to MongoDB');

    const adminEmail = 'admin@saas.com';
    
    // 2. Check if admin already exists
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      console.log('⚠️  Admin user already exists');
      process.exit();
    }

    // 3. Create Admin User
    // We don't need to manually hash password here because 
    // your User Model's "pre('save')" hook handles hashing automatically!
    const admin = new User({
      name: 'Super Admin',
      email: adminEmail,
      password: 'securePassword123!', 
      confirmPassword: 'securePassword123!', // Required by your validator
      plan: 'enterprise', // Grants full access immediately
      monthlyQuotaUsed: 0,
      quotaResetAt: new Date(),
      refreshTokens: [] // Start with empty sessions
    });

    await admin.save();
    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@saas.com');
    console.log('🔑 Pass: securePassword123!');
    
    process.exit();
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();