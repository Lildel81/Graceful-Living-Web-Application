const mongoose = require("mongoose");

const quizResponseSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  ageBracket: { type: String, required: true },
  jobTitle: { type: String, required: true },
  experience: { type: String, required: true },
  familiarWith: [{ type: String }],
  experienceDetails: { type: String },
  goals: { type: String, required: true },
  challenges: [{ type: String }],
  challengeOther: { type: String },
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("QuizResponse", quizResponseSchema);