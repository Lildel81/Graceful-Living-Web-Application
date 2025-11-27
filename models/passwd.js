// models/passwd.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');



const passwdSchema = new mongoose.Schema(
  {
    
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      minlength: 3,
      maxlength: 64,
      match: /^[a-zA-Z0-9._-]+$/,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: 254,
    },
    hash: {
      type: String,
      required: true,
      select: false, 
    },

    failedLoginCount: { type: Number, default: 0 },
    failWindowStart:  { type: Date,   default: null }, 
    lockUntil:        { type: Date,   default: null }, 
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.hash; 
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

passwdSchema.index({ username: 1 }, { unique: true });
passwdSchema.index({ email: 1 }, { unique: true });

// Helpers
passwdSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

passwdSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.hash);
};

passwdSchema.pre('save', function (next) {
  if (this.isModified('username') && this.username) {
    this.username = this.username.trim().toLowerCase();
  }
  if (this.isModified('email') && this.email) {
    this.email = this.email.trim().toLowerCase();
  }
  next();
});

passwdSchema.post('save', function (err, _doc, next) {
  if (err && err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    next(new Error(`A user with that ${field} already exists.`));
  } else {
    next(err);
  }
});

const Passwd = mongoose.models.Passwd || mongoose.model('Passwd', passwdSchema);
module.exports = Passwd;
