const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const multer = require('multer');
const path = require('path');

// set up multer storage with safe filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const originalBase = path.basename(file.originalname);
    const safeBase = originalBase.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    cb(null, `${timestamp}-${safeBase}`);
  }
});

// Allow only common image types and restrict file size to prevent DoS
const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic'
]);

const upload = multer({
  storage: storage,
  limits: {
    files: 1,
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

router.post('/upload', upload.single('photo'), clientController.handleUpload);
router.get('/gallery', clientController.getGalleryView);

// Delete image route -- add to client
router.delete('/delete/:imageName', clientController.deleteImage); 

module.exports = router;