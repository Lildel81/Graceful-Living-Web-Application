const { required } = require('joi');
const mongoose = require('mongoose');

const carouselSlideSchema = new mongoose.Schema({
    title:          {type: String, required: true},
    description:    {type: String, required: false},
    buttonText:     {type: String, required: false},
    buttonUrl:      {type: String, required: false},
    imageUrl:       {type: String, required: true},
    createdAt:      {type: Date, default: Date.now}
});

const CarouselSlide = mongoose.model('CarouselSlide', carouselSlideSchema);
module.exports = CarouselSlide;