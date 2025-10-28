const express = require('express');
const router = express.Router();
// const fs = require('fs');
// const path = require('path');
// const multer = require('multer');
// upload is the multer 
const upload = require('../middleware/upload.js');
const carousel = require('../controllers/carouselController');

// Ensure upload directory exists and configure storage
// const uploadDir = path.join(__dirname, '..', 'public', 'images', 'uploads');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }
// // Storage configuration for multer
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadDir), // save to public/images/uploads
//   filename: (req, file, cb) => {
//     const base = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
//     cb(null, `${Date.now()}-${base}`); // add timestamp to filename to avoid conflicts
//   }
// });

// const allowed = new Set(['image/jpeg','image/png','image/gif','image/webp', 'image/heic']);
// const upload = multer({
//   storage,
//   limits: { fileSize: 8 * 1024 * 1024, files: 1 },
//   fileFilter: (req, file, cb) => {
//     if (allowed.has(file.mimetype)) cb(null, true); else cb(new Error('Invalid image type'));
//   }
// });

// csrf 
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