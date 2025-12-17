const express = require('express');
const router = express.Router();
// const fs = require('fs');
// const path = require('path');
// const multer = require('multer');
// upload is the multer 
const carousel = require('../controllers/carouselController');
const { upload } = require('../middleware/upload');


const csrf = require('csurf');

const csrfProtection = csrf({
  cookie: {
    key: '_csrf',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  }
});

router.get('/adminportal/carouselmanagement', csrfProtection, carousel.getCarouselManagement);
router.get('/adminportal/carousel/:id/edit', csrfProtection, carousel.getEditSlideView);
router.post('/adminportal/carousel/create', upload.single('imageUpload'), csrfProtection, carousel.createSlide);
router.post('/adminportal/carousel/:id/update', upload.single('imageUpload'), csrfProtection, carousel.editSlide);
router.post('/adminportal/carousel/:id/delete', csrfProtection, carousel.deleteSlide);

module.exports = router;