const express = require('express');
const router = express.Router();
const csrf = require('../middleware/csrf');
const upload = require('../middleware/upload');
const shop = require('../controllers/shopController');

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Apply CSRF protection to all routes on this router
router.use(csrf);

// Expose csrfToken to views for forms (e.g., hidden input named _csrf)
router.use((req, res, next) => {
  if (typeof req.csrfToken === 'function') {
    res.locals.csrfToken = req.csrfToken();
  }
  next();
});

// ===== Admin routes (unchanged) =====
router.get('/admin/new', csrf, shop.adminForm);
router.post('/admin', upload.single('image'), csrf, shop.adminCreate);

// ===== Public shop pages (unchanged) =====
router.get('/', shop.listProducts);

/**
 * Stripe Checkout (hosted)
 * POST /shop/create-checkout-session
 * Accepts either:
 *   - amountCents (dynamic cart total), preferred
 *   - priceId (fixed Stripe Price ID), only if it looks valid (starts with price_)
 * Optional:
 *   - email (prefill Checkout email)
 *
 * Always responds by 303-redirecting to Stripe (no JSON).
 */
router.post('/create-checkout-session', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Missing STRIPE_SECRET_KEY');
      return res.status(500).send('Stripe not configured');
    }

    // Use APP_BASE_URL if set; otherwise build from the incoming request
    const baseURL = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;

    const { priceId, amountCents, email } = req.body;
    console.log('checkout body:', { priceId, amountCents, email });

    let line_items;

    // Prefer dynamic amount (cart subtotal)
    const cents = parseInt(amountCents, 10);
    if (Number.isFinite(cents) && cents >= 50) {
      line_items = [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'Graceful Living Order' },
          unit_amount: cents
        },
        quantity: 1
      }];
    } else if (typeof priceId === 'string' && /^price_/.test(priceId)) {
      // Only accept a real-looking Price ID
      line_items = [{ price: priceId, quantity: 1 }];
    } else {
      return res.status(400).send('No valid amount or price provided');
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${baseURL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseURL}/cancel`,
      ...(email ? { customer_email: email } : {})
    });

    // Always redirect the browser to Stripe
    return res.redirect(303, session.url);
  } catch (err) {
    console.error('Create session error:', err);
    return res.status(500).send('Failed to create checkout session');
  }
});

// Keep the slug route last so it doesn't catch other routes
router.get('/:slug', shop.showProduct);

module.exports = router;



