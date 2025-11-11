const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const footerController = require('../controllers/footerController');

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.redirect('/login');
}

const csrfProtection = csrf({
  cookie: {
    key: '_csrf',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  },
});

router.get('/adminportal/footer-settings', requireAdmin, csrfProtection, footerController.getFooterManagement);
router.post('/adminportal/footer-settings', requireAdmin, csrfProtection, footerController.updateFooterSettings);

module.exports = router;
