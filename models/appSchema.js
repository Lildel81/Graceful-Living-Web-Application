const mongoose = require('mongoose'); 
const Joi = require('joi');



const PRACTITIONER_ENUM = [
    'Currently working with one',
    'In the past',
    'First time',
    'Not sure',
    'Other',
];

const AGE_BRACKETS = [
    '20-30',
    '30-40',
    '40-50',
    '50+'
];

const FAMILIAR_WITH_ENUM = [
    'Kundalini Yoga',
    'Sound Baths',
    'Life Coaching',
    'Emotional Freedom Technique',
    'None of the above'
];

const CHALLENGES_ENUM = [
    'Physical',
    'Emotional',
    'Mental',
    'Spiritual',
    'Other'
];


const appSchema = new mongoose.Schema({
    //  Email Address
    email: {
        type: String,
        minlength: 1,
        maxlength: 100, 
        required: true
    }, 

    // Full Name
    fullName: {
        type: String,
        minlength: 1,
        maxlength: 50,
        required: true
    },

    //Contact Number 
    contactNumber:{
        type: String, 
        minlength: 10,
        maxlength:20,
        required: true
    },

    // Age Bracket
    ageBracket: {
        type: String,
        enum: AGE_BRACKETS,
        required: true
    },

    // Healthcare worker fields
    isHealthcareWorker: { 
        type: String,
        enum: ['Yes','No'], 
        required: true 
    },

    healthcareRole: { 
        type: String, 
        minlength: 1, 
        maxlength: 100 
    }, // req only if yes 

    healthcareYears: { 
        type: Number, 
        min: 0 
    },

    // Job Title 
    jobTitle:{
        type: String, 
        minlength: 1, 
        maxlength: 100, 
        required: true
    },

    // Worked with Practitioner before?
    workedWithPractitioner: {
        type: String,
        enum: PRACTITIONER_ENUM,
        required: true
    },

    //Familur with Checkbox 
    familiarWith: {
        type: [String],
        enum:FAMILIAR_WITH_ENUM,
        required: true,
        default:[]
    },

    // Experience (optional textarea)
    experience:{
        type: String,
        minlength: 1,
        maxlength: 1000,
        required: false
    },

    // Goals (required)
    goals:{
        type: String,
        minlength: 1,
        maxlength: 1000,
        required: true
    },

    // Challenges checkboxes 
    challenges:{
        type: [String],
        enum: CHALLENGES_ENUM,
        required: false,
        default: []
    },

  
    submittedAt:{
        type: Date,
        default: Date.now
    }
    
});

const Application = mongoose.model('Application', appSchema);

//terry modified the schema validation to better fit mongoose and work with csrf
const validateApplication = (app) => {
  const schema = Joi.object({
    csrfToken: Joi.any().strip(),
    _csrf: Joi.any().strip(),

    challengesOtherText: Joi.any().strip(),

     email: Joi.string().min(1).max(100).required(),
        fullName: Joi.string().min(1).max(50).required(),
        contactNumber:Joi.string().min(10).max(20).required(),
        ageBracket: Joi.string().valid(...AGE_BRACKETS).required(),

        // healthcare worker validation if yes or no is selected 
        isHealthcareWorker: Joi.string().valid('Yes','No').required(),
        healthcareRole: Joi.alternatives().conditional('isHealthcareWorker', {
        is: 'Yes',
        then: Joi.string().min(1).max(100).required(),
        //otherwise: Joi.string().empty('').optional()
        otherwise: Joi.any().strip()
        }),
        healthcareYears: Joi.alternatives().conditional('isHealthcareWorker', {
        is: 'Yes',
        then: Joi.number().integer().min(0).max(80).required(),
        otherwise: Joi.any().strip()
        }),

        jobTitle: Joi.string().max(100).required(),

        workedWithPractitioner: Joi.string()
            .valid(...PRACTITIONER_ENUM)
            .required(),

        familiarWith: Joi.array()
            .items(Joi.string().valid(...FAMILIAR_WITH_ENUM))
            .single(true)
            .default([]),

        experience: Joi.string().allow('').max(2000),

        goals: Joi.string().max(2000).required(),

        challenges: Joi.array()
            .items(Joi.string().valid(...CHALLENGES_ENUM))
            .single(true)
            .default([])
        })

  .prefs({ abortEarly: false, stripUnknown: true });

  return schema.validate(app);
};



module.exports = Application;
module.exports.validate = validateApplication;