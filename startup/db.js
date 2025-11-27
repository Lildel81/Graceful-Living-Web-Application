const mongoose = require('mongoose');
const winston = require('winston');
require('dotenv').config();

module.exports = function() {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => winston.info('✅ MongoDB connected successfully...'))
        .catch(err => console.error('❌ Could not connect to MongoDB:', err));
};
