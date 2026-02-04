const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;
const crypto = require('crypto');

const userSchema = new Schema({
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
        type: String,
        required: [true, 'User must have a password'],
        minlength: 8,
        select: false
    },
    confirmPassword: {
        type: String,
        required: [true, 'User must confirm password'],
        select: false,
        validate: {
            validator: function(val) { return val === this.password; },
            message: 'Passwords do not match'
        }
    },
    name: {
      type: String,
      default: '',
      trim: true,
    },
    
    // 🆕 ACCOUNT STATUS & PREFERENCES
    active: {
      type: Boolean,
      default: true,
      select: false // Hides this field from normal queries
    },
    preferences: {
        marketingEmails: { type: Boolean, default: true },
        productUpdates: { type: Boolean, default: true }
    },

    // PLAN & BILLING
    plan: {
      type: String,
      enum: ['free', 'starter', 'pro', 'agency'],
      default: 'free',
    },
    stripeCustomerId: String, 
    stripeSubscriptionId: String,
    stripeCurrentPeriodEnd: Date,

    // 🆕 USAGE TRACKING
    monthlyQuotaUsed: { type: Number, default: 0 },
    whisperQuotaUsed: { type: Number, default: 0 },
    imageQuotaUsed: { type: Number, default: 0 },   // 👈 New for Image Gen
    
    quotaResetAt: {
      type: Date,
      default: () => new Date(),
    },
    
    // AUTH TOKENS
    refreshTokens: [{
        token: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
}, { 
    timestamps: true 
});

// PRE-SAVE: Hash Password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
    this.confirmPassword = undefined;
});

// PRE-SAVE: Update passwordChangedAt
userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return;
    this.passwordChangedAt = Date.now() - 1000;
});

// 🆕 QUERY MIDDLEWARE: Hide deleted users automatically
userSchema.pre(/^find/, function(next) {
    // 'this' points to the current query
    this.find({ active: { $ne: false } });
});

userSchema.methods.passwordChangedAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

module.exports = mongoose.model('User', userSchema);