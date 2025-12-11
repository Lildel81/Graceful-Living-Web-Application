const mongoose = require('mongoose');
const winston = require('winston');
require('dotenv').config();

module.exports = function() {
    mongoose.connect('mongodb+srv://GracefuLivingAdmin:5TVWcWrBrWcjlTzp@cluster0.ufy9wtk.mongodb.net/bitbybitdevelopment?retryWrites=true&w=majority&appName=cluster0')
        .then(() => winston.info('✅ MongoDB connected successfully...'))
        .catch(err => console.error('❌ Could not connect to MongoDB:', err));
};
