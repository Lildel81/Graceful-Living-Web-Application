const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload.js');
const csrf = require('csurf');

const csrfProtection = csrf({
  cookie: {
    key: '_csrf',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  }
});

const svc = require('../controllers/servicesController');

router.get('/adminportal/servicesmanagement', csrfProtection, svc.getServicesPage);

// POST create: ***multer first***, then CSRF check, then controller
// router.post(
//   '/adminportal/contentmanagement/create',
//   upload.single('image'),  // for everyone else looking at this to fix uploads -- multer first
//   csrfProtection,          // then CSRF
//   svc.createService        // then controller
// );

router.post(
  '/adminportal/contentmanagement/create',
  upload.single('image'),
  (req, res, next) => {
    console.log('MULTER DEBUG:', {
      hasFile: !!req.file,
      file: req.file && {
        destination: req.file.destination,
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size
      },
      bodyKeys: Object.keys(req.body || {}),
      _csrf: req.body && req.body._csrf
    });
    next();
  },
  csrfProtection,
  svc.createService
);


module.exports = router;
