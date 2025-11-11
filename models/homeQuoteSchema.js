const mongoose = require("mongoose");

const homeQuoteSchema = new mongoose.Schema({
  quoteText: {
    type: String,
    required: true,
    default: '"Lorem ipsum dolor sit amet, consectetur adipiscing elit."'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("HomeQuote", homeQuoteSchema);
