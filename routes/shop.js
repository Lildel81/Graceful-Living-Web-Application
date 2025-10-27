const express = require('express');
const router = express.Router();
const csrf = require('../middleware/csrf');
const upload = require('../middleware/upload');
const shop = require('../controllers/shopController');

router.use(csrf);

router.use((req, res, next) => {
  if (typeof req.csrfToken === 'function') {
    res.locals.csrfToken = req.csrfToken();
  }
  next();
});


router.get('/admin/new', csrf, shop.adminForm);
router.post('/admin', upload.single('image'), csrf, shop.adminCreate);


router.get('/', shop.listProducts);
router.get('/:slug', shop.showProduct);

module.exports = router;
