const express = require('express');
const router = express.Router();
const checkout = require('../controllers/checkoutController');

router.get('/', checkout.getCheckout);
router.post('/intent', checkout.createPaymentIntent);
router.post('/webhook', checkout.webhook); // raw body required

module.exports = router;
