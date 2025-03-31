const mongoose = require('mongoose'); 
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
        required: true
    },
    phonenumber: {
        type: String,
        minlength: 10,
        required: true
    },
    email: {
        type: String,
        minlength: 1,
        maxlength: 100,
        required: true
    },
    closedChakra: {
        type: String,
        minlength: 1,
        maxlength: 50,
        required: true
    },
    currentDate:{
        type: String,
        minlength: 1,
        maxlength: 30,
        required: true
    }
    //add date month(spelled out) day 4 digit year
});

const Client = mongoose.model('Client', clientSchema);


const validateClient = (client) => {
    const schema = Joi.object({
        firstname: Joi.string().min(1).max(50).required(),
        lastname: Joi.string().min(1).max(50).required(),
        phonenumber: Joi.string().min(10).required(),
        email: Joi.string().min(1).max(100).required(),
        closedChakra: Joi.string().min(1).max(50).required(),
        currentDate: Joi.string().min(1).max(30).required(),
        //add date
    });

    return schema.validate(client);
};


module.exports = Client;
module.exports.validate = validateClient;
