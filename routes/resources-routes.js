const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const resourcesController = require('../controllers/resourcesController');

// debug middleware to log all requests hitting these routes
router.use((req, res, next) => {
  console.log(`[RESOURCES ROUTE] ${req.method} ${req.originalUrl}`);
  console.log("REQ BODY (pre-multer):", req.body);
  next();
});

// multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images/uploads');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + ext;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// management page
router.get('/adminportal/resourcesmanagement', resourcesController.getResourcesManagement);

// update text
router.post('/adminportal/resources/text/update', resourcesController.updateResourcesText);

// add new image
router.post('/adminportal/resources/create', upload.single('imageUpload'), resourcesController.createResourcesImage);

// edit page
router.get('/adminportal/resources/:id/edit', resourcesController.getEditResourcesImageView);

// update image
router.post(
  '/adminportal/resources/:id/update',
  upload.single('imageUpload'),
  (req, res, next) => {
    console.log("[DEBUG /update] BODY:", req.body);
    console.log("[DEBUG /update] FILE:", req.file);
    next();
  },
  resourcesController.editResourcesImage
);

// delete image
router.post('/adminportal/resources/:id/delete', resourcesController.deleteResourcesImage);

module.exports = router;

