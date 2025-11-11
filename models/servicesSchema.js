// schema for how images will be uploaded to mongodb
const mongoose = require('mongoose');
const { Schema } = mongoose;

const servicesSchema = new Schema({
    imageUrl:       {type: String, required: false},
    serviceName: { type: String, required: true},
    serviceDescription: { type: String, required: false },
    buttonText:  { type: String, required: false }, 
    buttonUrl:   { type: String, required: false },
    createdAt:      {type: Date, default: Date.now}
});

const Services = mongoose.model('Services', servicesSchema);
module.exports = Services;