// schema for how text will be uploaded to mongodb

const mongoose = require('mongoose');
const { Schema } = mongoose;

const resourcesTextSchema = new Schema({
  title: { type: String, default: "Resources" },
  // dynamic array so admin can input as many paragraphs as they want
  paragraphs: [{ type: String }],
  videoUrl: { type: String, default: "https://youtu.be/LKa0ABbkGrQ?si=RxNlk9td6FNo4GQc" },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ResourcesText', resourcesTextSchema);
