const express = require('express');
const router = express.Router();
const csurf = require('csurf');
const adminVideoController = require('../controllers/adminVideoController');

// CSRF protection setup
const csrfProtection = csurf({
    cookie: {
        key: "_csrf",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
    },
});

// GET route — render the admin content management page
router.get('/content-management', csrfProtection, adminVideoController.getContentManagement);

// POST route — update or create intro video URL
router.post('/update-intro-video', csrfProtection, adminVideoController.updateIntroVideo);

module.exports = router;
