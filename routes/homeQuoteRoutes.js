const express = require("express");
const router = express.Router();
const homeQuoteController = require("../controllers/homeQuoteController");
const csrf = require("csurf");

const csrfProtection = csrf({
  cookie: {
    key: '_csrf',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  }
});

router.get("/adminportal/quotemanagement", csrfProtection, homeQuoteController.getQuoteEditor);
router.post("/adminportal/quotemanagement", csrfProtection, homeQuoteController.updateQuote);

module.exports = router;
