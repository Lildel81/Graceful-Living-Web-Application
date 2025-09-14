const mongoose = require("mongoose");

const chakraAssessmentSchema = new mongoose.Schema({
  // root chakra responses
  root_needs: { type: String, required: true },
  root_bodycare: { type: String, required: true },
  root_nature: { type: String, required: true },
  root_money: { type: String, required: true },
  root_expression: { type: String, required: true },
  root_belonging: { type: String, required: true },
  root_trust: { type: String, required: true },

  // sacral chakra responses
  sacral_emotions: { type: String, required: true },
  sacral_creativity: { type: String, required: true },
  sacral_sensuality: { type: String, required: true },
  sacral_relationships: { type: String, required: true },
  sacral_change: { type: String, required: true },
  sacral_boundaries: { type: String, required: true },
  sacral_intimacy: { type: String, required: true },

  // solar plexus chakra responses
  solar_overextend: { type: String, required: true },
  solar_gut: { type: String, required: true },
  solar_celebrate: { type: String, required: true },
  solar_action: { type: String, required: true },
  solar_power: { type: String, required: true },
  solar_purpose: { type: String, required: true },
  solar_manifest: { type: String, required: true },

  // heart chakra responses
  heart_express: { type: String, required: true },
  heart_connected: { type: String, required: true },
  heart_vulnerable: { type: String, required: true },
  heart_joy: { type: String, required: true },
  heart_receive: { type: String, required: true },
  heart_forgive: { type: String, required: true },
  heart_selflove: { type: String, required: true },

  // throat chakra responses
  throat_holdback: { type: String, required: true },
  throat_creativity: { type: String, required: true },
  throat_heard: { type: String, required: true },
  throat_listen: { type: String, required: true },
  throat_no: { type: String, required: true },
  throat_trust: { type: String, required: true },

  // third eye chakra responses
  thirdEye_reflection: { type: String, required: true },
  thirdEye_clarity: { type: String, required: true },
  thirdEye_synchronicities: { type: String, required: true },
  thirdEye_dreams: { type: String, required: true },
  thirdEye_practices: { type: String, required: true },
  thirdEye_intuition: { type: String, required: true },
  thirdEye_knowing: { type: String, required: true },

  // crown chakra responses
  crown_surrender: { type: String, required: true },
  crown_transcendence: { type: String, required: true },
  crown_stillness: { type: String, required: true },
  crown_connection: { type: String, required: true },
  crown_purpose: { type: String, required: true },
  crown_practices: { type: String, required: true },
  crown_larger_unfolding: { type: String, required: true },

  // health & wellness quadrant
  hw_pushThrough: { type: String, required: true },
  hw_distractions: { type: String, required: true },
  hw_selfCare: { type: String, required: true },
  hw_approval: { type: String, required: true },
  hw_motivation: { type: String, required: true },

  // love & relationships quadrant
  love_prioritize_others: { type: String, required: true },
  love_unseen: { type: String, required: true },
  love_conflict_response: { type: String, required: true },
  love_transactional: { type: String, required: true },
  love_sabotage: { type: String, required: true },

  // career/job quadrant
  career_trapped: { type: String, required: true },
  career_obligation: { type: String, required: true },
  career_value: { type: String, required: true },
  career_resist: { type: String, required: true },
  career_perfectionism: { type: String, required: true },

  // time & money freedom quadrant
  timeMoney_balance: { type: String, required: true },
  timeMoney_hustle: { type: String, required: true },
  timeMoney_comfort: { type: String, required: true },
  timeMoney_survival: { type: String, required: true },
  timeMoney_investing: { type: String, required: true },

  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ChakraAssessment", chakraAssessmentSchema);