const express = require("express");
const bcrypt = require("bcrypt");
const session = require("express-session");
const User = require("../models/userSchema");
const ChakraAssessment = require("../models/chakraAssessment")
const csrfProtection = require("../middleware/csrf");

const router = express.Router();

/* get routes */
// signup form
router.get("/user-signup", csrfProtection, (req, res) => {
  res.render("user-signup", { 
    csrfToken: req.csrfToken(),
    error: null,
    fullName: "",
    email: ""
  });
});

// login form
router.get("/user-login", csrfProtection, (req, res) => {
  res.render("user-login", {
    csrfToken: req.csrfToken(),
    error: null,
    email: ""
  });
});

// logout
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

/* post routes */
/* helper function to save temp chakra results */
async function saveTempResultsToUser(req, userId) {
  if (req.session.tempResults) {
    const temp = req.session.tempResults;
    const assessment = await ChakraAssessment.findOne({ submissionId: temp.submissionId });
    if (assessment && !assessment.user) {
      assessment.user = userId;
      await assessment.save();
    }
    // clean up session
    delete req.session.tempResults;
    const returnUrl = req.session.tempResultsReturnUrl || "/user-dashboard";
    delete req.session.tempResultsReturnUrl;
    return returnUrl;
  }
  return null;
}

/* -------- SIGNUP -------- */
router.post("/user-signup", csrfProtection, async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).render("user-signup", {
      csrfToken: req.csrfToken(),
      error: "All fields are required.",
      fullName,
      email
    });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).render("user-signup", {
        csrfToken: req.csrfToken(),
        error: "Email is already registered.",
        fullName,
        email
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ fullName, email, password: hashed });
    await user.save();

    // log in immediately
    req.session.user = { _id: user._id, fullName: user.fullName, email: user.email };

    // save temp results if any
    const returnUrl = await saveTempResultsToUser(req, user._id);

    // redirect to results page or dashboard
    return res.redirect(returnUrl || "/user-dashboard");

  } catch (err) {
    console.error(err);
    res.status(500).render("user-signup", {
      csrfToken: req.csrfToken(),
      error: "Unexpected error. Please try again.",
      fullName,
      email
    });
  }
});

/* -------- LOGIN -------- */
router.post("/user-login", csrfProtection, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).render("user-login", { 
      csrfToken: req.csrfToken(),
      error: "Please fill in both fields", 
      email 
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).render("user-login", { 
        csrfToken: req.csrfToken(),
        error: "Invalid email or password", 
        email 
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).render("user-login", { 
        csrfToken: req.csrfToken(),
        error: "Invalid email or password", 
        email 
      });
    }

    // login success
    req.session.user = { _id: user._id, fullName: user.fullName, email: user.email };

    // save temp results if any
    const returnUrl = await saveTempResultsToUser(req, user._id);

    return res.redirect(returnUrl || "/user-dashboard");

  } catch (err) {
    console.error(err);
    res.status(500).render("user-login", { 
      csrfToken: req.csrfToken(),
      error: "Unexpected error. Please try again.", 
      email 
    });
  }
});

module.exports = router;
