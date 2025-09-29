const express = require("express");
const ChakraAssessment = require("../models/chakraAssessment");
const resultsContent = require("../public/js/results");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { notifyAdmins } = require("../services/adminNotifications");

// scoring scheme
const gradingScheme = {
  default: {
    Poor: 0,
    Fair: 1,
    Good: 2,
    Excellent: 3,
    Never: 0,
    Sometimes: 1,
    Often: 2,
    Always: 3,
  },
  solarPlexus: {
    q1: { Never: 3, Sometimes: 2, Often: 1, Always: 0 },
    default: {
      Poor: 0,
      Fair: 1,
      Good: 2,
      Excellent: 3,
      Never: 0,
      Sometimes: 1,
      Often: 2,
      Always: 3,
    },
  },
  crownChakra: {
    q2: { Poor: 0, Fair: 1, Good: 2, Excellent: 2 },
    default: {
      Poor: 0,
      Fair: 1,
      Good: 2,
      Excellent: 3,
      Never: 0,
      Sometimes: 1,
      Often: 2,
      Always: 3,
    },
  },
  loveRelationships: {
    q3: {
      "No, I never do either": 0,
      "Sometimes, I do one of these or both": 1,
      "Often I do one of these or both": 2,
      "Yes, I always do one of these or both": 3,
    },
    default: {
      Poor: 0,
      Fair: 1,
      Good: 2,
      Excellent: 3,
      Never: 0,
      Sometimes: 1,
      Often: 2,
      Always: 3,
    },
  },
};

// life quadrant archetype mapping
const archetypeMapping = {
  healthWellness: [
    ["workerBee", "martyr"],
    ["innerChild", "saboteur"],
    ["lover", "caretaker"],
    ["caretaker", "rebel"],
    ["saboteur", "lover"],
  ],
  loveRelationships: [
    ["caretaker", "martyr"],
    ["innerChild", "lover"],
    ["rebel", "creatorVisionary"],
    ["workerBee", "lover"],
    ["saboteur", "innerChild"],
  ],
  careerJob: [
    ["workerBee", "rebel"],
    ["martyr", "caretaker"],
    ["innerChild", "ruler"],
    ["rebel", "innerChild"],
    ["creatorVisionary", "saboteur"],
  ],
  timeMoney: [
    ["caretaker", "martyr"],
    ["workerBee", "saboteur"],
    ["innerChild", "saboteur"],
    ["saboteur", "workerBee"],
    ["martyr", "ruler"],
  ],
};

// helper function: get score for a question
function getScore(section, questionIndex, answer) {
  const sectionScheme = gradingScheme[section] || {};
  const perQuestion = sectionScheme[`q${questionIndex + 1}`];
  if (perQuestion && perQuestion.hasOwnProperty(answer))
    return perQuestion[answer];
  return gradingScheme.default[answer] ?? 0;
}

// score answers and attach numeric scores
function scoreAnswers(answersObj, sectionName = null) {
  const scored = {};
  const questions = Object.entries(answersObj);
  questions.forEach(([q, ans], index) => {
    scored[q] = {
      answer: ans,
      score: getScore(sectionName, index, ans),
    };
  });
  return scored;
}

// determine life quadrant archetype
function determineArchetype(lifeQuadrantScores) {
  const counts = {};
  Object.entries(lifeQuadrantScores).forEach(([quadrant, questions]) => {
    Object.entries(questions).forEach(([q, obj], index) => {
      const score = obj.score;
      const options = archetypeMapping[quadrant][index];
      const chosen = score <= 1 ? options[0] : options[1];
      counts[chosen] = (counts[chosen] || 0) + 1;
    });
  });
  // first max
  let maxCount = 0,
    selected = "";
  for (const [type, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      selected = type;
    }
  }
  return selected;
}

// determine dominant chakra
function findFocusChakra(results) {
  let maxTotal = -1,
    focusChakra = "";
  Object.entries(results).forEach(([chakra, data]) => {
    if (data.total > maxTotal) {
      maxTotal = data.total;
      focusChakra = chakra;
    }
  });
  return { focusChakra };
}

// routes
router.get("/", (req, res) => res.render("quiz/assessment"));

router.post("/save", async (req, res) => {
  try {
    const newId = uuidv4(); // generates a unique identifier

    // score chakras
    const scoredChakras = {
      rootChakra: scoreAnswers({
        root_needs: req.body.root_needs,
        root_bodycare: req.body.root_bodycare,
        root_nature: req.body.root_nature,
        root_money: req.body.root_money,
        root_expression: req.body.root_expression,
        root_belonging: req.body.root_belonging,
        root_trust: req.body.root_trust,
      }),
      sacralChakra: scoreAnswers({
        sacral_emotions: req.body.sacral_emotions,
        sacral_creativity: req.body.sacral_creativity,
        sacral_sensuality: req.body.sacral_sensuality,
        sacral_relationships: req.body.sacral_relationships,
        sacral_change: req.body.sacral_change,
        sacral_boundaries: req.body.sacral_boundaries,
        sacral_intimacy: req.body.sacral_intimacy,
      }),
      solarPlexusChakra: scoreAnswers(
        {
          solar_overextend: req.body.solar_overextend,
          solar_gut: req.body.solar_gut,
          solar_celebrate: req.body.solar_celebrate,
          solar_action: req.body.solar_action,
          solar_power: req.body.solar_power,
          solar_purpose: req.body.solar_purpose,
          solar_manifest: req.body.solar_manifest,
        },
        "solarPlexus"
      ),
      heartChakra: scoreAnswers({
        heart_express: req.body.heart_express,
        heart_connected: req.body.heart_connected,
        heart_vulnerable: req.body.heart_vulnerable,
        heart_joy: req.body.heart_joy,
        heart_receive: req.body.heart_receive,
        heart_forgive: req.body.heart_forgive,
        heart_selflove: req.body.heart_selflove,
      }),
      throatChakra: scoreAnswers({
        throat_holdback: req.body.throat_holdback,
        throat_creativity: req.body.throat_creativity,
        throat_heard: req.body.throat_heard,
        throat_listen: req.body.throat_listen,
        throat_no: req.body.throat_no,
        throat_trust: req.body.throat_trust,
      }),
      thirdEyeChakra: scoreAnswers({
        thirdEye_reflection: req.body.thirdEye_reflection,
        thirdEye_clarity: req.body.thirdEye_clarity,
        thirdEye_synchronicities: req.body.thirdEye_synchronicities,
        thirdEye_dreams: req.body.thirdEye_dreams,
        thirdEye_practices: req.body.thirdEye_practices,
        thirdEye_intuition: req.body.thirdEye_intuition,
        thirdEye_knowing: req.body.thirdEye_knowing,
      }),
      crownChakra: scoreAnswers(
        {
          crown_surrender: req.body.crown_surrender,
          crown_transcendence: req.body.crown_transcendence,
          crown_stillness: req.body.crown_stillness,
          crown_connection: req.body.crown_connection,
          crown_purpose: req.body.crown_purpose,
          crown_practices: req.body.crown_practices,
          crown_larger_unfolding: req.body.crown_larger_unfolding,
        },
        "crownChakra"
      ),
    };

    // calculate chakra totals & averages
    const results = {};
    Object.entries(scoredChakras).forEach(([section, questions]) => {
      const total = Object.values(questions).reduce(
        (sum, obj) => sum + obj.score,
        0
      );
      const avg = total / Object.keys(questions).length;
      results[section] = { total, average: avg.toFixed(2) };
    });

    // score life quadrants
    const scoredLifeQuadrants = {
      healthWellness: scoreAnswers(
        {
          hw_pushThrough: req.body.hw_pushThrough,
          hw_distractions: req.body.hw_distractions,
          hw_selfCare: req.body.hw_selfCare,
          hw_approval: req.body.hw_approval,
          hw_motivation: req.body.hw_motivation,
        },
        "default"
      ),
      loveRelationships: scoreAnswers(
        {
          love_prioritize_others: req.body.love_prioritize_others,
          love_unseen: req.body.love_unseen,
          love_conflict_response: req.body.love_conflict_response,
          love_transactional: req.body.love_transactional,
          love_sabotage: req.body.love_sabotage,
        },
        "loveRelationships"
      ),
      careerJob: scoreAnswers(
        {
          career_trapped: req.body.career_trapped,
          career_obligation: req.body.career_obligation,
          career_value: req.body.career_value,
          career_resist: req.body.career_resist,
          career_perfectionism: req.body.career_perfectionism,
        },
        "default"
      ),
      timeMoney: scoreAnswers(
        {
          timeMoney_balance: req.body.timeMoney_balance,
          timeMoney_hustle: req.body.timeMoney_hustle,
          timeMoney_comfort: req.body.timeMoney_comfort,
          timeMoney_survival: req.body.timeMoney_survival,
          timeMoney_investing: req.body.timeMoney_investing,
        },
        "default"
      ),
    };

    const focusChakra = findFocusChakra(results).focusChakra;
    const archetype = determineArchetype(scoredLifeQuadrants);

    // handle "other" options
    const experienceValue =
      req.body.experience === "other" && req.body.experienceOtherText
        ? "Other: " + req.body.experienceOtherText
        : req.body.experience;

    // save to DB
    const assessmentResponse = new ChakraAssessment({
      submissionId: newId,
      fullName: req.body.fullName,
      email: req.body.email,
      contactNumber: req.body.contactNumber,
      ageBracket: req.body.ageBracket,
      healthcareWorker: req.body.healthcareWorker,
      healthcareYears: req.body.healthcareYears,
      jobTitle: req.body.jobTitle,
      experience: experienceValue,
      familiarWith: Array.isArray(req.body.familiarWith)
        ? req.body.familiarWith
        : [req.body.familiarWith],
      experienceDetails: req.body.experienceDetails,
      goals: req.body.goals,
      challenges: Array.isArray(req.body.challenges)
        ? req.body.challenges
        : [req.body.challenges],
      challengeOther: req.body.challengeOtherText,
      results,
      focusChakra,
      archetype,

      ...req.body, // keeps all raw answers, can replace with selective fields if preferred
      scoredChakras,
      scoredLifeQuadrants,
    });

    await assessmentResponse.save();
    // --- build email payload & notify admins (non-blocking) ---
    const payload = {
      meta: {
        quizId: "chakra-assessment-v1",
        quizTitle: "Chakra Assessment",
        submissionId: newId,
        completedAt: new Date().toISOString(),
      },
      identity: {
        fullName: req.body.fullName,
        email: req.body.email,
        contactNumber: req.body.contactNumber,
        goals: req.body.goals,
      },
      sections: {
        root: {
          root_needs: req.body.root_needs,
          root_bodycare: req.body.root_bodycare,
          root_nature: req.body.root_nature,
          root_money: req.body.root_money,
          root_expression: req.body.root_expression,
          root_belonging: req.body.root_belonging,
          root_trust: req.body.root_trust,
        },
        sacral: {
          sacral_emotions: req.body.sacral_emotions,
          sacral_creativity: req.body.sacral_creativity,
          sacral_sensuality: req.body.sacral_sensuality,
          sacral_relationships: req.body.sacral_relationships,
          sacral_change: req.body.sacral_change,
          sacral_boundaries: req.body.sacral_boundaries,
          sacral_intimacy: req.body.sacral_intimacy,
        },
        solar: {
          solar_overextend: req.body.solar_overextend,
          solar_gut: req.body.solar_gut,
          solar_celebrate: req.body.solar_celebrate,
          solar_action: req.body.solar_action,
          solar_power: req.body.solar_power,
          solar_purpose: req.body.solar_purpose,
          solar_manifest: req.body.solar_manifest,
        },
        heart: {
          heart_express: req.body.heart_express,
          heart_connected: req.body.heart_connected,
          heart_vulnerable: req.body.heart_vulnerable,
          heart_joy: req.body.heart_joy,
          heart_receive: req.body.heart_receive,
          heart_forgive: req.body.heart_forgive,
          heart_selflove: req.body.heart_selflove,
        },
        throat: {
          throat_holdback: req.body.throat_holdback,
          throat_creativity: req.body.throat_creativity,
          throat_heard: req.body.throat_heard,
          throat_listen: req.body.throat_listen,
          throat_no: req.body.throat_no,
          throat_trust: req.body.throat_trust,
        },
        thirdEye: {
          thirdEye_reflection: req.body.thirdEye_reflection,
          thirdEye_clarity: req.body.thirdEye_clarity,
          thirdEye_synchronicities: req.body.thirdEye_synchronicities,
          thirdEye_dreams: req.body.thirdEye_dreams,
          thirdEye_practices: req.body.thirdEye_practices,
          thirdEye_intuition: req.body.thirdEye_intuition,
          thirdEye_knowing: req.body.thirdEye_knowing,
        },
        crown: {
          crown_surrender: req.body.crown_surrender,
          crown_transcendence: req.body.crown_transcendence,
          crown_stillness: req.body.crown_stillness,
          crown_connection: req.body.crown_connection,
          crown_purpose: req.body.crown_purpose,
          crown_practices: req.body.crown_practices,
          crown_larger_unfolding: req.body.crown_larger_unfolding,
        },
        healthWellness: {
          hw_pushThrough: req.body.hw_pushThrough,
          hw_distractions: req.body.hw_distractions,
          hw_selfCare: req.body.hw_selfCare,
          hw_approval: req.body.hw_approval,
          hw_motivation: req.body.hw_motivation,
        },
        loveRelationships: {
          love_prioritize_others: req.body.love_prioritize_others,
          love_unseen: req.body.love_unseen,
          love_conflict_response: req.body.love_conflict_response,
          love_transactional: req.body.love_transactional,
          love_sabotage: req.body.love_sabotage,
        },
        careerJob: {
          career_trapped: req.body.career_trapped,
          career_obligation: req.body.career_obligation,
          career_value: req.body.career_value,
          career_resist: req.body.career_resist,
          career_perfectionism: req.body.career_perfectionism,
        },
        timeMoney: {
          timeMoney_balance: req.body.timeMoney_balance,
          timeMoney_hustle: req.body.timeMoney_hustle,
          timeMoney_comfort: req.body.timeMoney_comfort,
          timeMoney_survival: req.body.timeMoney_survival,
          timeMoney_investing: req.body.timeMoney_investing,
        },
      },
    };

    notifyAdmins(payload)
      .then(() => console.log("[ASSESSMENT] notifyAdmins OK"))
      .catch((err) => console.error("[ASSESSMENT] notifyAdmins FAIL", err));
    // --- end email notify ---
    res.redirect(`/assessment/results?id=${newId}`);
  } catch (err) {
    console.error("Error saving assessment:", err);
    res.status(500).send("Error saving assessment response");
  }
});

// send to results page
router.get("/results", async (req, res) => {
  try {
    const assessment = await ChakraAssessment.findOne({
      submissionId: req.query.id,
    });
    if (!assessment) return res.status(404).send("Assessment not found");

    // look up the full chakra and archetype content
    const chakraData = resultsContent.chakras[assessment.focusChakra];
    const archetypeData = resultsContent.archetypes[assessment.archetype];

    // render the page with full objects
    res.render("quiz/results", {
      chakraData,
      archetypeData,
    });
  } catch (err) {
    console.error("Error fetching assessment:", err);
    res.status(500).send("Error fetching assessment");
  }
});

module.exports = router;
