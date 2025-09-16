// schema for how images will be uploaded to mongodb
const mongoose = require('mongoose');
const { Schema } = mongoose;

const resourcesImageSchema = new Schema({
    imageUrl:       {type: String, required: true},
    overlayText: { type: String, required: false },
    buttonText:  { type: String, required: false }, 
    buttonUrl:   { type: String, required: false },  
    createdAt:      {type: Date, default: Date.now}
});

const ResourcesImage = mongoose.model('ResourcesImage', resourcesImageSchema);
module.exports = ResourcesImage;
