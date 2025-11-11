const express = require('express');
const router = express.Router();
const csrf = require('../middleware/csrf');
const checkout = require('../controllers/checkoutController');

/**
 * Stripe webhook (raw body, NO CSRF, must be before any body parsers/CSRF)
 * This is for your existing PaymentIntents flow only.
 * 
 */
router.post('/webhook', express.raw({ type: 'application/json' }), checkout.webhook);

// Apply CSRF to the rest of /checkout and expose token to EJS
router.use(csrf);
router.use((req, res, next) => {
  if (typeof req.csrfToken === 'function') {
    res.locals.csrfToken = req.csrfToken();
  }
  next();
});

// Render the checkout page (uses csrfToken in the view)
router.get('/', checkout.getCheckout);

// Legacy PaymentIntent endpoint (not needed for Stripe Checkout hosted flow,
// but kept here in case other code still calls it)
router.post('/intent', checkout.createPaymentIntent);

module.exports = router;


