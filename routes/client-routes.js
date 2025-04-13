const express = require('express');
const {getHubView,getHomeView,getAssessmentView,getAdminPortalView,getContactView,getResourcesView,getNotFoundView,getServicesView,getShopView,
    getApplicationView} = require ('../controllers/clientController');


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



module.exports = {
    routes: router
};
