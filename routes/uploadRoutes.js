const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const multer = require('multer');

// set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

router.post('/upload', upload.single('photo'), clientController.handleUpload);
router.get('/gallery', clientController.getGalleryView);

// Delete image route -- add to client
router.delete('/delete/:imageName', clientController.deleteImage); 

module.exports = router;