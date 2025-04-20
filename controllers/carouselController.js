const CarouselSlide = require('../models/carouselSlide');
const fs = require('fs');
const path = require('path');

const getCarouselManagement = async(req, res) => {
    const slides = await CarouselSlide.find().sort({createdAt: -1});
    res.render('carouselmanagement', {slides});
};

const getEditSlideView = async(req, res) => {
    const slide = await CarouselSlide.findById(req.params.id);
    res.render('editslide', {slide});
};

const createSlide = async(req, res) => {
    const {title, description, buttonText, buttonUrl, imageOption, imageUrl} = req.body;

    let imagePath = imageUrl;
    if(imageOption === 'upload' && req.file) {
        imagePath = `/images/uploads/${req.file.filename}`;
    }
    else if (imageOption === 'url' && imageUrl){
        imagePath = imageUrl;
    }
    else{
        imagePath = 'images/default-fallback.jpg';
    }

    await CarouselSlide.create ({
        title,
        description,
        buttonText,
        buttonUrl,
        imageUrl: imagePath
    });

    res.redirect('/adminportal/carouselmanagement');
};

const deleteSlide = async(req, res) => {
    const id = req.params.id;
    await CarouselSlide.findByIdAndDelete(id);
    res.redirect('/adminportal/carouselmanagement');
};

const editSlide = async (req, res) => {
    const { title, description, buttonText, buttonUrl, imageOption, imageUrl } = req.body;
    let imagePath = imageUrl;
  
    if (imageOption === 'upload' && req.file) {
      imagePath = `/images/uploads/${req.file.filename}`;
    }
  
    await CarouselSlide.findByIdAndUpdate(req.params.id, {
      title,
      description,
      buttonText,
      buttonUrl,
      imageUrl: imagePath
    });
  
    res.redirect('/adminportal/carouselmanagement');
  };

module.exports = {
    getCarouselManagement,
    createSlide,
    deleteSlide,
    getEditSlideView,
    editSlide
};