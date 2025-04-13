const mongoose = require('mongoose'); 
const Joi = require('joi');

const appSchema = new mongoose.Schema({
    fullName: {
        type: String,
        minlength: 1,
        maxlength: 50,
        required: true
    },
    age: {
        type: Number,
        minlength: 1,
        maxlength: 3,
        required: true
    },
    email: {
        type: String,
        minlength: 1,
        maxlength: 100,
        required: true
    },
    reason: {
        type: String,
        minlength: 1,
        maxlength: 1000,
        required: true
    },
    workedWithPractitioner: {
        type: String,
        minlength: 1,
        maxlength: 20,
        required: true
    },
    familiarWith: {
        type: String,
        minlength: 1,
        maxlength: 100,
        required: true
    },
    experience:{
        type: String,
        minlength: 1,
        maxlength: 1000,
        required: true
    },
    goals:{
        type: String,
        minlength: 1,
        maxlength: 1000,
        required: true
    },
    challenges:{
        type: String,
        minlength: 1,
        maxlength: 1000,
        required: false
    },
    anythingElse:{
        type: String,
        minlength: 1,
        maxlength: 1000,
        required: false
    },
    submittedAt:{
        type: Date,
        default: Date.now
    }
    
});

const Application = mongoose.model('Application', appSchema);


const validateApplication = (app) => {
    const schema = Joi.object({
        fullName: Joi.string().min(1).max(50).required(),
        age: Joi.number().integer().min(1).max(3).required(),
        email: Joi.string().min(1).max(100).required(),
        reason: Joi.string().min(1).max(1000).required(),
        workedWithPractitioner: Joi.string(1).min(20).max().required(),
        familiarWith: Joi.string().min(1).max(100).required(),
        experience: Joi.string().min(1).max(1000).required(),
        goals: Joi.string().min(1).max(1000).required(),
        challenges: Joi.string().min(1).max(1000).allow(''),
        anythingElse: Joi.string().min(1).max(1000).allow('')
    });

    return schema.validate(app);
};


module.exports = Application;
module.exports.validate = validateApplication;