const { required } = require('joi');
const mongoose = require('mongoose');

const footerSchema = new mongoose.Schema({
    phone:{
        type: String, 
        default: ' '
    },

    facebookUrl:{
        type: String,
        default: ''
    },

    facebookLabel:{ 
        type: String, 
        default: 'Facebook'
    },

    instagramUrl:{ 
        type: String, 
        default: '' 
    },

    instagramLabel:{ 
        type: String, 
        default: 'Instagram' 
    },
    youtubeUrl:{ 
        type: String, 
        default: ''
    },
    youtubeLabel:{ 
        type: String, 
        default: 'YouTube'  
    }


});

module.exports = mongoose.model('footer', footerSchema);