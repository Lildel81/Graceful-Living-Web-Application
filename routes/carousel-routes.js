const express = require('express');
const router = express.Router();
const upload = require('multer')({dest: 'public/images/uploads'});
const carousel = require('../controllers/carouselController');

router.get('/adminportal/carouselmanagement', carousel.getCarouselManagement);
router.get('/adminportal/carousel/:id/edit', carousel.getEditSlideView);
router.post('/adminportal/carousel/create', upload.single('imageUpload'), carousel.createSlide);
router.post('/adminportal/carousel/:id/update', upload.single('imageUpload'), carousel.editSlide);
router.post('/adminportal/carousel/:id/delete', carousel.deleteSlide);

module.exports = router;