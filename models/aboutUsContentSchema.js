// schema for about us page content being stored in mongodb
const mongoose = require('mongoose');
const { Schema } = mongoose;

const aboutUsContentSchema = new Schema({
    imageUrl: {type: String, required: false},
    title: {type: String, required: true},
    description: {type: String, required: true},

    createdAt: {type: Date, default: Date.now}
});

const AboutUsContent = mongoose.model('AboutUsContent', aboutUsContentSchema);
module.exports = AboutUsContent;