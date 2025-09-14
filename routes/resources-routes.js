const express = require('express');
const router = express.Router();
const upload = require('multer')({ dest: 'public/images/uploads' });
const resourcesController = require('../controllers/resourcesController');

// management page
router.get('/adminportal/resourcesmanagement', resourcesController.getResourcesManagement);

// add new image
router.post('/adminportal/resources/create', upload.single('imageUpload'), resourcesController.createResourcesImage);

// edit page
router.get('/adminportal/resources/:id/edit', resourcesController.getEditResourcesImageView);

// update image
router.post('/adminportal/resources/:id/update', upload.single('imageUpload'), resourcesController.editResourcesImage);

// delete image
router.post('/adminportal/resources/:id/delete', resourcesController.deleteResourcesImage);

module.exports = router;