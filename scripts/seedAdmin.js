const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../src/models/userModel'); // Adjust path if needed

// 1. Connect to Database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB for seeding'))
  .catch(err => {
    console.error('❌ DB Connection Error:', err);
    process.exit(1);
  });

const seedUsers = async () => {
  try {
    // OPTIONAL: Clear existing users to avoid duplicates
     await User.deleteMany({});
     console.log('🧹 Old users cleared');

    // 3. Define the "Admin" / Agency User
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: '123456789', // The model's pre-save hook should hash this
      confirmPassword: '123456789',
      // The Important Bits for the New Model 👇
      plan: 'agency',           // Give them the best plan
      monthlyQuotaUsed: 0,      // Start fresh
      whisperQuotaUsed: 0,      // Start fresh
      quotaResetAt: new Date()
    });

    await adminUser.save();
    console.log('👑 Admin (Agency) User created: admin@example.com');

    // 4. Define a "Free" User for testing limits
    const freeUser = new User({
      name: 'Free User',
      email: 'free@example.com',
      password: '123456789',
      confirmPassword: '123456789',
      plan: 'free',
      monthlyQuotaUsed: 0,
      whisperQuotaUsed: 0,
      quotaResetAt: new Date()
    });

    await freeUser.save();
    console.log('👶 Free User created: free@example.com');

    console.log('✨ Seeding complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

// Run the function
seedUsers();