// schema for about us page intro being stored in mongodb
const mongoose = require('mongoose');
const { Schema } = mongoose;

const aboutUsIntroSchema = new Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    headshotUrl: {type: String, required: true},

    createdAt:{type: Date, default: Date.now}
});

const AboutUsIntro = mongoose.model('AboutUsIntro', aboutUsIntroSchema);
module.exports = AboutUsIntro;

