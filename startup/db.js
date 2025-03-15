const mongoose = require('mongoose');
const winston = require('winston');

module.exports = function() {
    mongoose.connect('mongodb+srv://bitbybit:bitbybit@bitbybitdevelopmentclus.gu7lm.mongodb.net/bitbybitdevelopment?retryWrites=true&w=majority&appName=bitbybitdevelopmentcluster')
        .then(() => winston.info('✅ MongoDB connected successfully...'))
        .catch(err => console.error('❌ Could not connect to MongoDB:', err));
};
