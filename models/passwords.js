const mongoose = require('mongoose');

const hashedPasswords = new mongoose.Schema({
  name: { type: String, required: true },
  hash: { type: String, required: true }
});

module.exports = mongoose.model('HashedPasswords', passwordSchema);