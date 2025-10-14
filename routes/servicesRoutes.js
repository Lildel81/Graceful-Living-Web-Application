const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/servicesController');

router.get(
    '/adminportal/servicesmanagement', 
    servicesController.getServicesPage
);

// route to handle form submission (inserting a new service)
router.post("/adminportal/contentmanagement/create", servicesController.createService);

module.exports = router;