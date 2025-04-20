const express = require('express');
const {getHubView,getHomeView,getAssessmentView,getAdminPortalView,getContactView,getResourcesView,getNotFoundView,getServicesView,getShopView,
    getApplicationView, getReviewsView} = require ('../controllers/clientController');


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
//router.get('/login', getAdminPortalView); // This is for me to go to adminportal faster


module.exports = {
    routes: router
};
