const mongoose = require('mongoose');

const HomeQuoteSchema = new mongoose.Schema({

    quoteText: {
        type: String,
        default: '“Lorem ipsum dolor sit amet, consectetur adipiscing elit.”',
    },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('HomeQuote', HomeQuoteSchema);