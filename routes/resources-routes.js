const express = require('express');
const router = express.Router();

// upload is the multer 
const upload = require('../middleware/upload.js');
const resourcesController = require('../controllers/resourcesController');

// debug middleware to log all requests hitting these routes
// DO NOT USE BC IT EXPOSES CREDENTIALS
/*router.use((req, res, next) => {
  console.log(`[RESOURCES ROUTE] ${req.method} ${req.originalUrl}`);
  console.log("REQ BODY (pre-multer):", req.body);
  next();
});*/

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

// management page
router.get('/adminportal/resourcesmanagement', csrfProtection, resourcesController.getResourcesManagement);

// update text
router.post('/adminportal/resources/text/update', csrfProtection, resourcesController.updateResourcesText);

// add new image
router.post('/adminportal/resources/create', upload.single('imageUpload'), csrfProtection, resourcesController.createResourcesImage);

// edit page
router.get('/adminportal/resources/:id/edit', csrfProtection, resourcesController.getEditResourcesImageView);

// update image
router.post(
  '/adminportal/resources/:id/update',
  upload.single('imageUpload'),
  /*  FOR DEBUGGING
  (req, res, next) => {
    console.log("[DEBUG /update] BODY:", req.body);
    console.log("[DEBUG /update] FILE:", req.file);
    next();
  },*/
  csrfProtection,
  resourcesController.editResourcesImage
);

// delete image
router.post('/adminportal/resources/:id/delete', csrfProtection, resourcesController.deleteResourcesImage);

module.exports = router;

