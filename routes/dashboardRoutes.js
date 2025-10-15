const express = require("express");
const ChakraAssessment = require("../models/chakraAssessment");
const router = express.Router();
const csrfProtection = require('../middleware/csrf');


router.post("/delete/:id", requireLogin, async (req, res) => {
  const id = req.params.id;
  await ChakraAssessment.findByIdAndDelete(id);
  res.redirect("/user-dashboard");
});

// middleware to protect route
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/user-login?error=Please+log+in+first");
  }
  next();
}

router.get("/", requireLogin, csrfProtection, async (req, res) => {
  try {
    const assessments = await ChakraAssessment.find({ user: req.session.user })
      .sort({ createdAt: -1 })
      .select("submissionId focusChakra archetype createdAt");

    res.render("user-dashboard",{
      assessments,
      csrfToken: req.csrfToken()
    });
  } catch (err) {
    console.error("Error loading dashboard:", err);
    res.status(500).send("Error loading dashboard");
  }
});

module.exports = router;