const express = require("express");
const QuizResponse = require("../models/quizResponse");
const router = express.Router();

router.post("/save", async (req, res) => {
  try {
    // destructure fields from req.body
    const {
      fullName,
      contactNumber,
      ageBracket,
      jobTitle,
      experience,
      experienceOther,
      familiarWith,
      experienceDetails,
      goals,
      challenges,
      challengeOther
    } = req.body;

    // if experience is "other", store the extra detail
    const experienceValue =
      experience === "other" && experienceOther
        ? "Other: " + experienceOther
        : experience;

    // save to MongoDB
    const response = new QuizResponse({
      fullName,
      contactNumber,
      ageBracket,
      jobTitle,
      experience: experienceValue,
      familiarWith: Array.isArray(familiarWith)
        ? familiarWith
        : [familiarWith], // ensure array
      experienceDetails,
      goals,
      challenges: Array.isArray(challenges)
        ? challenges
        : [challenges], // ensure array
      challengeOther,
      submittedAt: new Date()
    });

    await response.save();

    res.redirect("/assessment"); // placeholder
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving response");
  }
});

module.exports = router;