const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;

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
      enum: ['free', 'pro', 'premium', 'enterprise'],
      default: 'free',
    },
    monthlyQuotaUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    quotaResetAt: {
      type: Date,
      default: () => new Date(),
    },
    subscriptionId: {
      type: String,
      default: null,
    },
    currentSession: {
        type: String,
        select: false
    },
    passwordChangedAt: Date,
},{ 
    timestamps: true 
});


// Encrypt password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return ;
    }
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordChangedAt = Date.now() - 1000;
    this.confirmPassword = undefined;
});

//method to check if the user has changed their password after a JWT was issued
userSchema.methods.passwordChangedAfter = function(JWTTimestamp){
    if(this.passwordChangedAt){
        const passwordChangedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        //console.log(passwordChangedTimestamp, JWTTimestamp)
        return JWTTimestamp < passwordChangedTimestamp;
    }
    return false;
}

// Compare entered password with hashed one
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.pre('save', async function(){
    if(!this.isModified('password') || this.isNew){
        return;
    }
    
    this.passwordChangedAt = Date.now() - 1000;
})

module.exports = mongoose.model('User', userSchema);
