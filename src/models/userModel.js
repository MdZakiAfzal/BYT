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
    password:{
        type: String,
        required: [true, 'User must have a password'],
        minlength: 8,
        select: false
    },
    confirmPassword:{
        type: String,
        required: [true, 'User must confirm password'],
        select: false,
        //this only works for "create or save" and not for update
        validate:{
            validator: function(val){
                return val === this.password;
            },
            message: 'Passwords do not match'
        }
    },
    name: {
      type: String,
      default: '',
      trim: true,
    },
    plan: {
      type: String,
      enum: ['free', 'pro', 'premium', 'agency'],
      default: 'free',
    },
    monthlyQuotaUsed: {
      type: Number,
      default: 0
    },
    whisperQuotaUsed: {
      type: Number,
      default: 0
    },
    quotaResetAt: {
      type: Date,
      default: () => new Date(),
    },
    subscriptionId: {
      type: String,
      default: null,
    },
    refreshTokens: [{
        token: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
},{ 
    timestamps: true 
});


// 1. Encrypt password before saving
userSchema.pre('save', async function () {
    // If password is not modified, simply return (promise resolves automatically)
    if (!this.isModified('password')) return;

    this.password = await bcrypt.hash(this.password, 12);
    this.confirmPassword = undefined; // Do not persist this field
});

// 4. Method: Check if password changed after token was issued
userSchema.methods.passwordChangedAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    // False means NOT changed
    return false;
};

// 3. Method: Check if password is correct
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// 2. Update passwordChangedAt property for the password reset functionality
userSchema.pre('save', async function () {
    if (!this.isModified('password') || this.isNew) return;

    this.passwordChangedAt = Date.now() - 1000;
});

// 5. Method: Generate Reset Token
userSchema.methods.createPasswordResetToken = function() {
    // 1. Generate a random 32-char hex string
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 2. Encrypt it (sha256) and save to DB
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // 3. Set expiration (10 minutes)
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    // 4. Return the PLAIN token (to send via email)
    return resetToken;
};

module.exports = mongoose.model('User', userSchema);
