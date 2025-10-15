// FOR TESTING PURPOSES ONLY 

const express = require("express");
const router = express.Router();

// GET route - show form
router.get("/simple-form", (req, res) => {
  res.render("simpleForm", { csrfToken: req.csrfToken() , layout: false});
});

// POST route - handle form submission
router.post("/simple-form", (req, res) => {
  const { name, email, message } = req.body;
  console.log("Form submitted:", { name });
  res.render("simpleFormSuccess", { name , layout: false});
});

module.exports = router;