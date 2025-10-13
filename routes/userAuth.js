const express = require("express");
const bcrypt = require("bcrypt");
const session = require("express-session");
const User = require("../models/userSchema");

const router = express.Router();

// signup
router.post("/user-signup", async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).render("user-signup", {
      error: "All fields are required.",
      fullName,
      email
    });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).render("user-signup", {
        error: "Email is already registered.",
        fullName,
        email
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ fullName, email, password: hashed });
    await user.save();

    // log in
    req.session.user = { _id: user._id, fullName: user.fullName, email: user.email };

    // after saving tempResults on signup
    if (req.session.tempResults) {
      const ChakraAssessment = require("../models/chakraAssessment");
      const temp = req.session.tempResults;
      const assessment = await ChakraAssessment.findOne({ submissionId: temp.submissionId });
      if (assessment && !assessment.user) {
        assessment.user = user._id;
        await assessment.save();
      }

      // redirect back to the results page they were viewing
      const returnUrl = req.session.tempResultsReturnUrl || "/user-dashboard";
      delete req.session.tempResults;
      delete req.session.tempResultsReturnUrl;

      return res.redirect(returnUrl);
    }

    // normal redirect if no tempResults
    res.redirect("/user-dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).render("user-signup", {
      error: "Unexpected error. Please try again.",
      fullName,
      email
    });
  }
});

// login
router.post("/user-login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).render("user-login", { error: "Please fill in both fields", email });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).render("user-login", { error: "Invalid email or password", email });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).render("user-login", { error: "Invalid email or password", email });
    }

    req.session.user = { _id: user._id, fullName: user.fullName, email: user.email };

    // after saving tempResults on signup
    if (req.session.tempResults) {
      const ChakraAssessment = require("../models/chakraAssessment");
      const temp = req.session.tempResults;
      const assessment = await ChakraAssessment.findOne({ submissionId: temp.submissionId });
      if (assessment && !assessment.user) {
        assessment.user = user._id;
        await assessment.save();
      }

      // redirect back to the results page they were viewing
      const returnUrl = req.session.tempResultsReturnUrl || "/user-dashboard";
      delete req.session.tempResults;
      delete req.session.tempResultsReturnUrl;

      return res.redirect(returnUrl);
    }

    // normal redirect if no tempResults
    res.redirect("/user-dashboard");

  } catch (err) {
    console.error(err);
    res.status(500).render("user-login", { error: "Unexpected error. Please try again.", email });
  }
});

// logout
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;
