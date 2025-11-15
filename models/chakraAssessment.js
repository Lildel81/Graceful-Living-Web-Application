const mongoose = require("mongoose");

// Jocelyn added to try and fix familiar with filter 
const FAMILIAR_WITH_ENUM = [
    'Kundalini Yoga',
    'Sound Baths',
    'Life Coaching',
    'Emotional Freedom Technique',
    'None of the above'
];

const answerSchema = new mongoose.Schema({
  answer: { type: String },
  score: { type: Number }
}, { _id: false });

const chakraSchema = new mongoose.Schema({
  rootChakra: { type: Map, of: answerSchema },
  sacralChakra: { type: Map, of: answerSchema },
  solarPlexusChakra: { type: Map, of: answerSchema },
  heartChakra: { type: Map, of: answerSchema },
  throatChakra: { type: Map, of: answerSchema },
  thirdEyeChakra: { type: Map, of: answerSchema },
  crownChakra: { type: Map, of: answerSchema }
}, { _id: false });

const lifeQuadrantSchema = new mongoose.Schema({
  healthWellness: { type: Map, of: answerSchema },
  loveRelationships: { type: Map, of: answerSchema },
  careerJob: { type: Map, of: answerSchema },
  timeMoney: { type: Map, of: answerSchema }
}, { _id: false });

const chakraAssessmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  submissionId: { type: String, required: true, unique: true },

  // user info
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  contactNumber: { type: String, required: true },
  ageBracket: { type: String, required: true },
  healthcareWorker: { type: String, required: true },
  healthcareYears: { type: String },
  jobTitle: { type: String },
  experience: { type: String },
  experienceOther: {type: string},
  familiarWith: { type: [String] }, // jocelyn updated , enum: FAMILIAR_WITH_ENUM, trim: true
  experienceDetails: { type: String },
  goals: { type: String },
  challenges: { type: [String] },
  challengeOther: { type: String },

  // raw answers (optional, can store all fields from req.body)
  rawAnswers: { type: mongoose.Schema.Types.Mixed },

  // scored answers
  scoredChakras: chakraSchema,
  scoredLifeQuadrants: lifeQuadrantSchema,

  // calculated results
  results: { type: Map, of: new mongoose.Schema({
    total: Number,
    average: String
  }, { _id: false }) },

  focusChakra: { type: String },
  archetype: { type: String },

}, { timestamps: true });

module.exports = mongoose.model("ChakraAssessment", chakraAssessmentSchema);