const express = require('express');
const {getHubView,getHomeView,getAssessmentView,getAdminPortalView,getContactView,getResourcesView,getNotFoundView,getServicesView,getShopView,
    getApplicationView, getReviewsView, getContentManagementView} = require ('../controllers/clientController');

    const { submitApplication } = require('../controllers/applicationController');
const router = express.Router();

router.get('/', getHomeView);
router.get('/hub', getHubView);
router.get('/assessment', getAssessmentView);
router.get('/adminportal', getAdminPortalView);
router.get('/contact', getContactView);
router.get('/resources', getResourcesView);
router.get('/notFound', getNotFoundView);
router.get('/services', getServicesView);
router.get('/shop', getShopView);
router.get('/application', getApplicationView);
router.get('/reviews', getReviewsView)
<<<<<<< HEAD

// get route for the application view 
router.get('/application', getApplicationView);
// POST route for application
router.post('/application',submitApplication); 

=======
router.get('/content', getContentManagementView);
>>>>>>> 9d0f27d (aaa)

module.exports = {
    routes: router
};
