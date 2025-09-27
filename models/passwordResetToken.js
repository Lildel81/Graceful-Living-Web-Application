const { MongoExpiredSessionError } = require('mongodb');
const mongoose = require('mongoose');

const PasswordResetTokenSchema = new mongoose.Schema({
    tokenHash: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },



    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date },
});

PasswordResetTokenSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });


module.exports = mongoose.model('PasswordResetToken', PasswordResetTokenSchema);
