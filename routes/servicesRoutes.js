const express = require('express');
const router = express.Router();
// upload is the multer 
const { upload } = require('../middleware/upload')

// csrf 
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

// svc is controller 
const svc = require('../controllers/servicesController');

// get the page 
router.get('/adminportal/servicesmanagement', csrfProtection, svc.getServicesPage);

// POST create: ***multer first***, then CSRF check, then controller
// router.post(
//   '/adminportal/contentmanagement/create',
//   upload.single('image'),  // for everyone else looking at this to fix uploads -- multer first
//   csrfProtection,          // then CSRF
//   svc.createService        // then controller
// );

// create
router.post(
  '/adminportal/contentmanagement/create',
  upload.single('imageUrl'),
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

// delete 
router.post("/adminportal/services/:id/delete", svc.deleteService);

// get edit 
router.get("/adminportal/services/:id/edit", csrfProtection, svc.editService);

// post update edit 
router.post("/adminportal/services/:id/edit", upload.single("imageUrl"), csrfProtection, svc.updateService);

module.exports = router;
