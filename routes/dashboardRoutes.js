const express = require("express");
const ChakraAssessment = require("../models/chakraAssessment");
const router = express.Router();
const csrfProtection = require('../middleware/csrf');
const bcrypt = require('bcrypt');
const User = require('../models/userSchema');


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

// Update Email Route
router.post('/update-email', csrfProtection, async (req, res) => {
  try {
    const { newEmail, password } = req.body;
    const userId = req.session.user?._id;

    if (!userId) {
      return res.status(401).send('Not authenticated');
    }

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).send('Incorrect password');
    }

    // Check if new email is already taken
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).send('Email already in use');
    }

    // Update email
    user.email = newEmail;
    await user.save();

    // Update session
    req.session.user.email = newEmail;

    res.redirect('/user-dashboard?success=email-updated');
  } catch (err) {
    console.error('Error updating email:', err);
    res.status(500).send('Error updating email');
  }
});

// Change Password Route
router.post('/change-password', csrfProtection, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.session.user?._id;

    if (!userId) {
      return res.status(401).send('Not authenticated');
    }

    // Validate passwords match
    if (newPassword !== confirmNewPassword) {
      return res.status(400).send('New passwords do not match');
    }

    // Validate password length
    if (newPassword.length < 8) {
      return res.status(400).send('Password must be at least 8 characters');
    }

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).send('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.redirect('/user-dashboard?success=password-changed');
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).send('Error changing password');
  }
});

// Delete Account Route
router.post('/delete-account', csrfProtection, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.session.user?._id;

    if (!userId) {
      return res.status(401).send('Not authenticated');
    }

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).send('Incorrect password');
    }

    // Delete all user's assessments
    await ChakraAssessment.deleteMany({ user: userId });

    // Delete user account
    await User.findByIdAndDelete(userId);

    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      res.redirect('/?deleted=true');
    });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).send('Error deleting account');
  }
});

// only logged in users can access user dashboard
router.get("/", requireLogin, csrfProtection, async (req, res) => {
  try {
    const assessments = await ChakraAssessment.find({ user: req.session.user })
      .sort({ createdAt: -1 })
      .select("submissionId focusChakra archetype createdAt");

    res.render("user-dashboard", {
      assessments,
      csrfToken: req.csrfToken()
    });
  } catch (err) {
    console.error("Error loading dashboard:", err);
    res.status(500).send("Error loading dashboard");
  }
});

module.exports = router;