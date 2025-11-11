const HomeQuote = require("../models/homeQuoteSchema");

// show quote editor
exports.getQuoteEditor = async (req, res) => {
  try {
    const quote = await HomeQuote.findOne() || new HomeQuote();
    res.render("quoteManagement", {
      csrfToken: req.csrfToken(),
      quote,
      layout: false
    });
  } catch (err) {
    console.error("Error loading quote", err);
    res.status(500).send("Error loading quote");
  }
};

// update quote
exports.updateQuote = async (req, res) => {
  try {
    const { quoteText } = req.body;
    let quote = await HomeQuote.findOne();

    if (quote) {
      quote.quoteText = quoteText;
      quote.updatedAt = new Date();
      await quote.save();
    } else {
      quote = new HomeQuote({ quoteText });
      await quote.save();
    }

    res.redirect("/adminportal/quotemanagement");
  } catch (err) {
    console.error("Error updating homepage quote", err);
    res.status(500).send("Error saving homepage quote");
  }
};
