const mongoose = require('mongoose'); // ✅ Fixed typo
const Joi = require('joi');

const clientSchema = new mongoose.Schema({
    firstname: {
        type: String,
        minlength: 1,
        maxlength: 50,
        required: true
    },
    lastname: {
        type: String,
        minlength: 1,
        maxlength: 50,
        required: false
    },
    phonenumber: {
        type: String,
        minlength: 10,
        required: false
    },
    email: {
        type: String,
        minlength: 1,
        maxlength: 100,
        required: true,
    },
    closedChakra: {
        type: String,
        minlength: 1,
        maxlength: 50,
        required: true
    }
});

const Client = mongoose.model('Client', clientSchema);

// ✅ Fixed validation function
const validateClient = (client) => {
    const schema = Joi.object({
        firstname: Joi.string().min(1).max(50).required(),
        lastname: Joi.string().min(1).max(50),
        phonenumber: Joi.string().min(10),
        email: Joi.string().min(1).max(100).required(),
        closedChakra: Joi.string().min(1).max(50),
    });

    return schema.validate(client);
};

// ✅ Correctly export the model and validation
module.exports = Client;
module.exports.validate = validateClient;
