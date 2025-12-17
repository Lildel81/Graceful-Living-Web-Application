const express = require('express');
const router = express.Router();
const csrf = require('../middleware/csrf');
const { upload } = require('../middleware/upload');
const shop = require('../controllers/shopController');

const Stripe = require('stripe');
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = Stripe(process.env.STRIPE_SECRET_KEY);
}

const withCsrf = (req, res, next) => {
  if (typeof req.csrfToken === 'function') {
    res.locals.csrfToken = req.csrfToken();
  }
  next();
};

router.get('/admin/new', csrf, withCsrf, requireAdmin, shop.adminForm);
router.post(
  '/admin',
  upload.single('image'),
  (req, res, next) => {
    console.log('[SHOP][DEBUG upload] body:', req.body, 'file:', req.file && req.file.filename);
    next();
  },
  csrf,
  shop.adminCreate
);

router.get('/', shop.listProducts);

router.get('/:slug', csrf, withCsrf, shop.showProduct);

router.post('/create-checkout-session', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !stripe) {
      console.error('Missing STRIPE_SECRET_KEY');
      return res.status(500).send('Stripe not configured');
    }
    const baseURL = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const { priceId, amountCents, email } = req.body;

    let line_items;
    const cents = parseInt(amountCents, 10);
    if (Number.isFinite(cents) && cents >= 50) {
      line_items = [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'GracefuLiving Order' },
          unit_amount: cents
        },
        quantity: 1
      }];
    } else if (typeof priceId === 'string' && /^price_/.test(priceId)) {
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

    return res.redirect(303, session.url);
  } catch (err) {
    console.error('Create session error:', err);
    return res.status(500).send('Failed to create checkout session');
  }
});

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(403).redirect('/login');
}

router.get('/admin/list', csrf, withCsrf, requireAdmin, shop.adminList);
router.get('/admin/:id/edit', csrf, withCsrf, requireAdmin, shop.adminEditForm);

// Update (no photo change). Regular urlencoded form, so csrf can run before controller.
router.post('/admin/:id', csrf, requireAdmin, shop.adminUpdate);

// Delete product + image
router.post('/admin/:id/delete', csrf, requireAdmin, shop.adminDelete);

module.exports = router;
