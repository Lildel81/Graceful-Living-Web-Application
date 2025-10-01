// controllers/assessmentController.js
const { notifyAdmins } = require("../services/adminNotifications");

function groupAnswers(body) {
  const identity = {
    fullName: body.fullName || null,
    email: body.email || null,
    contactNumber: body.contactNumber || null,
    ageBracket: body.ageBracket || null,
    healthcareWorker: body.healthcareWorker || null,
    healthcareYears: body.healthcareYears || null,
    jobTitle: body.jobTitle || null,
    experience: body.experience || null,
    experienceOtherText: body.experienceOtherText || null,
    familiarWith: Array.isArray(body.familiarWith)
      ? body.familiarWith
      : body.familiarWith
      ? [body.familiarWith]
      : [],
    experienceDetails: body.experienceDetails || null,
    goals: body.goals || null,
    challenges: Array.isArray(body.challenges)
      ? body.challenges
      : body.challenges
      ? [body.challenges]
      : [],
    challengeOtherText: body.challengeOtherText || null,
  };

  const root = {
    root_needs: body.root_needs,
    root_bodycare: body.root_bodycare,
    root_nature: body.root_nature,
    root_money: body.root_money,
    root_expression: body.root_expression,
    root_belonging: body.root_belonging,
    root_trust: body.root_trust,
  };

  const sacral = {
    sacral_emotions: body.sacral_emotions,
    sacral_creativity: body.sacral_creativity,
    sacral_sensuality: body.sacral_sensuality,
    sacral_relationships: body.sacral_relationships,
    sacral_change: body.sacral_change,
    sacral_boundaries: body.sacral_boundaries,
    sacral_intimacy: body.sacral_intimacy,
  };

  const solar = {
    solar_overextend: body.solar_overextend,
    solar_gut: body.solar_gut,
    solar_celebrate: body.solar_celebrate,
    solar_action: body.solar_action,
    solar_power: body.solar_power,
    solar_purpose: body.solar_purpose,
    solar_manifest: body.solar_manifest,
  };

  const heart = {
    heart_express: body.heart_express,
    heart_connected: body.heart_connected,
    heart_vulnerable: body.heart_vulnerable,
    heart_joy: body.heart_joy,
    heart_receive: body.heart_receive,
    heart_forgive: body.heart_forgive,
    heart_selflove: body.heart_selflove,
  };

  const throat = {
    throat_holdback: body.throat_holdback,
    throat_creativity: body.throat_creativity,
    throat_heard: body.throat_heard,
    throat_listen: body.throat_listen,
    throat_no: body.throat_no,
    throat_trust: body.throat_trust,
  };

  const thirdEye = {
    thirdEye_reflection: body.thirdEye_reflection,
    thirdEye_clarity: body.thirdEye_clarity,
    thirdEye_synchronicities: body.thirdEye_synchronicities,
    thirdEye_dreams: body.thirdEye_dreams,
    thirdEye_practices: body.thirdEye_practices,
    thirdEye_intuition: body.thirdEye_intuition,
    thirdEye_knowing: body.thirdEye_knowing,
  };

  const crown = {
    crown_surrender: body.crown_surrender,
    crown_transcendence: body.crown_transcendence,
    crown_stillness: body.crown_stillness,
    crown_connection: body.crown_connection,
    crown_purpose: body.crown_purpose,
    crown_practices: body.crown_practices,
    crown_larger_unfolding: body.crown_larger_unfolding,
  };

  const healthWellness = {
    hw_pushThrough: body.hw_pushThrough,
    hw_distractions: body.hw_distractions,
    hw_selfCare: body.hw_selfCare,
    hw_approval: body.hw_approval,
    hw_motivation: body.hw_motivation,
  };

  const loveRelationships = {
    love_prioritize_others: body.love_prioritize_others,
    love_unseen: body.love_unseen,
    love_conflict_response: body.love_conflict_response,
    love_transactional: body.love_transactional,
    love_sabotage: body.love_sabotage,
  };

  const careerJob = {
    career_trapped: body.career_trapped,
    career_obligation: body.career_obligation,
    career_value: body.career_value,
    career_resist: body.career_resist,
    career_perfectionism: body.career_perfectionism,
  };

  const timeMoney = {
    timeMoney_balance: body.timeMoney_balance,
    timeMoney_hustle: body.timeMoney_hustle,
    timeMoney_comfort: body.timeMoney_comfort,
    timeMoney_survival: body.timeMoney_survival,
    timeMoney_investing: body.timeMoney_investing,
  };

  return {
    meta: {
      quizId: "chakra-assessment-v1",
      quizTitle: "Chakra Assessment",
      completedAt: new Date(),
    },
    identity,
    sections: {
      root,
      sacral,
      solar,
      heart,
      throat,
      thirdEye,
      crown,
      healthWellness,
      loveRelationships,
      careerJob,
      timeMoney,
    },
  };
}

exports.saveAssessment = async (req, res) => {
  try {
    console.log("[ASSESSMENT] POST /assessment/save reached");
    const payload = groupAnswers(req.body);
    console.log(
      "[ASSESSMENT] payload built:",
      Object.keys(payload.sections || {})
    );

    console.log("[ASSESSMENT] calling notifyAdmins…");
    // Fire-and-forget email so redirect isn’t blocked
    notifyAdmins(payload)
      .then(() => console.log("[ASSESSMENT] notifyAdmins OK"))
      .catch((err) => console.error("[ASSESSMENT] notifyAdmins FAIL", err));

    return res.redirect("/assessment/thanks");
  } catch (err) {
    console.error("[saveAssessment] error", err);
    return res
      .status(500)
      .send("Sorry, something went wrong saving your assessment.");
  }
};
