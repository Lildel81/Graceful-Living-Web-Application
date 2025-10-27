
const express = require('express');
const router = express.Router();
const csrf = require('../middleware/csrf');
const { viewCart, addToCart, removeFromCart } = require('../controllers/cartController');

console.log('cartController loaded keys:', Object.keys(require('../controllers/cartController')));


router.use(csrf);


router.use((req, res, next) => {
  if (typeof req.csrfToken === 'function') {
    res.locals.csrfToken = req.csrfToken();
  }
  next();
});

router.get('/', csrf, viewCart);
router.post('/add', csrf, addToCart);
router.post('/remove/:id', csrf, removeFromCart);

module.exports = router;
