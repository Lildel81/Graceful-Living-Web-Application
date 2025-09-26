const express = require('express');
const {getHubView,getHomeView,getAssessmentView,getIntroductionView,getGettingToKnowYouView,getAdminPortalView,getContactView,getResourcesView,getNotFoundView,getServicesView,getShopView,
    getApplicationView, getPreAppView, getReviewsView, getContentManagementView, getResourcesManagementView, getLoginView,
    getApplicationSuccessView,getClientManagementView} = require ('../controllers/clientController');


const router = express.Router();
const Testimonial = require('../models/testimonial');

// application routes 
const { submitApplication } = require('../controllers/applicationController');


router.get('/', getHomeView);
router.get('/hub', getHubView);
router.get('/intro', getIntroductionView)
router.get('/getting-to-know-you', getGettingToKnowYouView)
router.get('/assessment', getAssessmentView);
router.get('/adminportal', requireAdmin, getAdminPortalView);
router.get('/contact', getContactView);
router.get('/resources', getResourcesView);
router.get('/notFound', getNotFoundView);
router.get('/services', getServicesView);
router.get('/shop', getShopView);
router.get('/pre-app', getPreAppView);
router.get('/application', getApplicationView);
router.get('/app-success', getApplicationSuccessView);
router.get('/reviews', getReviewsView)
router.get('/content-management', requireAdmin, getContentManagementView);
router.get('/login', getLoginView);
router.get('/adminportal/resourcesmanagement', requireAdmin, getResourcesManagementView);
router.get('/clientmanagement', requireAdmin, getClientManagementView);

// Pre application 

router.post('/application', submitApplication);

//router.get('/login', getAdminPortalView); // This is for me to go to adminportal faster

router.post('/admin/add-review', requireAdmin, async (req, res) => {
    try {
      const { name, quote, location, event } = req.body;
  
      await Testimonial.create({ name, quote, location, event });
  
      res.redirect('/adminportal?submitted=true');
    } catch (error) {
      console.error('Error saving testimonial:', error);
      res.status(500).send('Something went wrong.');
    }
  });

  function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) return next();

    return res.status(403).redirect('/login');
  }

module.exports = {
    routes: router
};
