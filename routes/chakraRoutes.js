const express = require("express");
const ChakraAssessment = require("../models/chakraAssessment");
const router = express.Router();

// route to display the assessment form
router.get("/", (req, res) => {
  res.render("quiz/assessment"); // renders assessment.ejs
});

// route to save assessment results
router.post("/save", async (req, res) => {
  try {
    console.log("Received assessment data:", req.body); // for debugging
    
    // create new assessment response with all the form data
    const assessmentResponse = new ChakraAssessment({
      // root chakra
      root_needs: req.body.root_needs,
      root_bodycare: req.body.root_bodycare,
      root_nature: req.body.root_nature,
      root_money: req.body.root_money,
      root_expression: req.body.root_expression,
      root_belonging: req.body.root_belonging,
      root_trust: req.body.root_trust,

      // sacral chakra
      sacral_emotions: req.body.sacral_emotions,
      sacral_creativity: req.body.sacral_creativity,
      sacral_sensuality: req.body.sacral_sensuality,
      sacral_relationships: req.body.sacral_relationships,
      sacral_change: req.body.sacral_change,
      sacral_boundaries: req.body.sacral_boundaries,
      sacral_intimacy: req.body.sacral_intimacy,

      // solar plexus chakra
      solar_overextend: req.body.solar_overextend,
      solar_gut: req.body.solar_gut,
      solar_celebrate: req.body.solar_celebrate,
      solar_action: req.body.solar_action,
      solar_power: req.body.solar_power,
      solar_purpose: req.body.solar_purpose,
      solar_manifest: req.body.solar_manifest,

      // heart chakra
      heart_express: req.body.heart_express,
      heart_connected: req.body.heart_connected,
      heart_vulnerable: req.body.heart_vulnerable,
      heart_joy: req.body.heart_joy,
      heart_receive: req.body.heart_receive,
      heart_forgive: req.body.heart_forgive,
      heart_selflove: req.body.heart_selflove,

      // throat chakra
      throat_holdback: req.body.throat_holdback,
      throat_creativity: req.body.throat_creativity,
      throat_heard: req.body.throat_heard,
      throat_listen: req.body.throat_listen,
      throat_no: req.body.throat_no,
      throat_trust: req.body.throat_trust,

      // third eye chakra
      thirdEye_reflection: req.body.thirdEye_reflection,
      thirdEye_clarity: req.body.thirdEye_clarity,
      thirdEye_synchronicities: req.body.thirdEye_synchronicities,
      thirdEye_dreams: req.body.thirdEye_dreams,
      thirdEye_practices: req.body.thirdEye_practices,
      thirdEye_intuition: req.body.thirdEye_intuition,
      thirdEye_knowing: req.body.thirdEye_knowing,

      // crown chakra
      crown_surrender: req.body.crown_surrender,
      crown_transcendence: req.body.crown_transcendence,
      crown_stillness: req.body.crown_stillness,
      crown_connection: req.body.crown_connection,
      crown_purpose: req.body.crown_purpose,
      crown_practices: req.body.crown_practices,
      crown_larger_unfolding: req.body.crown_larger_unfolding,

      // health & wellness
      hw_pushThrough: req.body.hw_pushThrough,
      hw_distractions: req.body.hw_distractions,
      hw_selfCare: req.body.hw_selfCare,
      hw_approval: req.body.hw_approval,
      hw_motivation: req.body.hw_motivation,

      // love & relationships
      love_prioritize_others: req.body.love_prioritize_others,
      love_unseen: req.body.love_unseen,
      love_conflict_response: req.body.love_conflict_response,
      love_transactional: req.body.love_transactional,
      love_sabotage: req.body.love_sabotage,

      // career/job
      career_trapped: req.body.career_trapped,
      career_obligation: req.body.career_obligation,
      career_value: req.body.career_value,
      career_resist: req.body.career_resist,
      career_perfectionism: req.body.career_perfectionism,

      // time & money freedom
      timeMoney_balance: req.body.timeMoney_balance,
      timeMoney_hustle: req.body.timeMoney_hustle,
      timeMoney_comfort: req.body.timeMoney_comfort,
      timeMoney_survival: req.body.timeMoney_survival,
      timeMoney_investing: req.body.timeMoney_investing,
    });

    await assessmentResponse.save();
    console.log("Assessment saved successfully!");

    // redirect to a thank you page & results page
    res.redirect("/assessment/thank-you"); 
  } catch (err) {
    console.error("Error saving assessment:", err);
    res.status(500).send("Error saving assessment response");
  }
});

// thank you & results page route
router.get("/thank-you", (req, res) => {
  res.render("assessment-thank-you"); // placeholder until this gets added
});

module.exports = router;