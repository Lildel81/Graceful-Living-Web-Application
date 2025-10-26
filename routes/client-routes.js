// routes/client-routes.js
const express = require('express');
const {
  getHubView,
  getHomeView,
  getAssessmentView,
  getIntroductionView,
  getGettingToKnowYouView,
  getAdminPortalView,
  getContactView,
  getResourcesView,
  getNotFoundView,
  getServicesView,
  getShopView,
  getApplicationView,
  getPreAppView,
  getReviewsView,
  getContentManagementView,
  getResourcesManagementView,
  getLoginView,
  getApplicationSuccessView,
  getClientManagementView,
  postCreateClient,
  getClientEditView,
  postUpdateClient,
  postDeleteClient,
  getChakraQuizResults, 
  getPreQuizResults
} = require('../controllers/clientController');

const {
  listTestimonials,
  getCreateTestimonial,
  postCreateTestimonial,
  getEditTestimonial,
  postUpdateTestimonial,
  postDeleteTestimonial,
} = require('../controllers/testimonialController');

const { submitApplication } = require('../controllers/applicationController');

const router = express.Router();

/* -------------------- Public / General -------------------- */
router.get('/', getHomeView);
router.get('/hub', getHubView);
router.get('/intro', getIntroductionView);
router.get('/getting-to-know-you', getGettingToKnowYouView);
router.get('/assessment', getAssessmentView);
router.get('/contact', getContactView);
router.get('/resources', getResourcesView);
router.get('/notFound', getNotFoundView);
router.get('/services', getServicesView);
router.get('/shop', getShopView);
router.get('/pre-app', getPreAppView);
router.get('/application', getApplicationView);
router.get('/app-success', getApplicationSuccessView);
router.get('/reviews', getReviewsView); // public testimonials page
router.get('/login', getLoginView);

/* -------------------- Admin-only Views -------------------- */
router.get('/adminportal', requireAdmin, getAdminPortalView);
router.get('/content-management', requireAdmin, getContentManagementView);
router.get('/user-login', getLoginView);     // reuse existing login view
router.get('/user-signup', getLoginView);    // reuse existing login view
router.get('/adminportal/resourcesmanagement', requireAdmin, getResourcesManagementView);
router.get('/clientmanagement', requireAdmin, getClientManagementView);
router.get('/clientmanagement/prequiz-results', requireAdmin, getPreQuizResults);
router.get('/clientmanagement/chakraquiz-results', requireAdmin, getChakraQuizResults);router.get('/clientmanagement/prequiz-results', requireAdmin, getPreQuizResults);
router.get('/clientmanagement/chakraquiz-results', requireAdmin, getChakraQuizResults);

/* -------------------- Client Management -------------------- */
router.get('/clientmanagement/add', requireAdmin, (req, res) => {
  res.render('client-add', { formError: null, formValues: {} });
});
router.post('/admin/clients', requireAdmin, postCreateClient);

// --- Client CRUD (edit + delete) ---
router.get('/clientmanagement/:id/edit', requireAdmin, getClientEditView);
router.post('/clientmanagement/:id/update', requireAdmin, postUpdateClient);
router.post('/clientmanagement/:id/delete', requireAdmin, postDeleteClient);

/* ---------- Allow iframe only for testimonials manager (same-origin) ---------- */
router.use('/admin/testimonials', (req, res, next) => {
  // XFO: allow same-origin embedding
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // CSP: ensure frame-ancestors includes self (and remove any older FA if present)
  const existing = res.getHeader('Content-Security-Policy');
  const fa = "frame-ancestors 'self'";
  if (existing) {
    const withoutFA = existing.replace(/frame-ancestors[^;]*;?/i, '').trim();
    const merged = withoutFA ? `${withoutFA}; ${fa}` : fa;
    res.setHeader('Content-Security-Policy', merged);
  } else {
    res.setHeader('Content-Security-Policy', fa);
  }
  next();
});

/* -------------------- Testimonials Management (CRUD) -------------------- */
router.get('/admin/testimonials', requireAdmin, listTestimonials);
router.get('/admin/testimonials/new', requireAdmin, getCreateTestimonial);
router.post('/admin/testimonials', requireAdmin, postCreateTestimonial);
router.get('/admin/testimonials/:id/edit', requireAdmin, getEditTestimonial);
router.post('/admin/testimonials/:id', requireAdmin, postUpdateTestimonial);
router.post('/admin/testimonials/:id/delete', requireAdmin, postDeleteTestimonial);

/* -------------------- Applications -------------------- */
router.post('/application', submitApplication);

/* -------------------- Auth Guard -------------------- */
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(403).redirect('/login');
}

module.exports = {
  routes: router,
};


