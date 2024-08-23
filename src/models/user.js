const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 50,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  roles: {
    type: String, // Array of strings, e.g., ['user', 'admin']
    enum: ['admin', 'staff', 'user'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profile: {
    firstName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Other' },
    address: {
      street: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: '' },
      postalCode: { type: String, trim: true, default: '' }
    },
    phone: { type: String, trim: true, default: '' }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  },
  lastLogin: {
    type: Date
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpires: {
    type: Date
  }
});

// Hash the password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password') || this.isNew) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      this.updatedAt = Date.now();
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

// Prevent email and username changes after creation
userSchema.pre('save', function (next) {
  if (!this.isNew) {
    if (this.isModified('email') || this.isModified('username')) {
      return next(new Error('Cannot change email or username once set.'));
    }
  }
  next();
});

// Generate password reset token
userSchema.methods.generatePasswordReset = function () {
  this.passwordResetToken = crypto.randomBytes(20).toString('hex');
  this.passwordResetExpires = Date.now() + 3600000; // 1 hour
};

// Validate password
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// To JSON: remove sensitive information
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
