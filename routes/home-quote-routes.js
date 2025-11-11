const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const { 
    getHomeQuoteManagement,
    updateHomeQuoteSettings,
} = require('../controllers/homeQuoteController');

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

router.get('/adminportal/homequote-settings', requireAdmin, csrfProtection, getHomeQuoteManagement);
router.post('/adminportal/homequote-settings', requireAdmin, csrfProtection, updateHomeQuoteSettings);

module.exports = router;