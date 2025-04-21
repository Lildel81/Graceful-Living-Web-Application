const mongoose = require('mongoose');
const Joi = require('joi');

const testimonialSchema = new mongoose.Schema({
    quote: String,
    name: String,
    location: String,
    event: String
});

const testimonials = mongoose.model('testimonials', testimonialSchema);

const validateTestimonial = (app) => {
    const schema = Joi.object({
        quote: Joi.string().min(1).max(1000).required(),
        name: Joi.string().min(1).max(50).allow(''),
        location: Joi.string().min(1).max(50).allow(''),
        event: Joi.string().min(1).max(50).allow('')
    });

    return schema.validate(app);
};

module.exports = testimonials;
module.exports.validate = validateTestimonial;