const Stripe = require('stripe');
const Order = require('../models/order');

// Oanh commented it out because it was causing an error when running the app
 const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
//  Environment-based Stripe initialization
//  Development: Use fallback dummy key to prevent crashes
//  Production: Require actual STRIPE_SECRET_KEY environment variable
const stripeKey = process.env.STRIPE_SECRET_KEY || (process.env.NODE_ENV === 'development' ? 'sk_test_dummy_key_for_development' : null);

if (!stripeKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required in production');
}

//const stripe = new Stripe(stripeKey);

exports.getCheckout = (req, res) => {
  const cart = req.session.cart;
  if (!cart || !cart.count) return res.redirect('/cart');
  res.render('checkout', { title: 'Checkout', cart });
};

exports.createPaymentIntent = async (req, res, next) => {
  try {
    const cart = req.session.cart;
    if (!cart || !cart.count) return res.status(400).json({ error: 'Empty cart' });

    const intent = await stripe.paymentIntents.create({
      amount: cart.subtotalCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true }
    });

    const order = await Order.create({
      email: req.body.email,
      items: Object.values(cart.items).map(i => ({ title: i.title, priceCents: i.priceCents, quantity: i.qty })),
      subtotalCents: cart.subtotalCents,
      stripePaymentIntentId: intent.id,
      status: 'pending'
    });

    res.json({ clientSecret: intent.client_secret, orderId: order._id });
  } catch (e) { next(e); }
};

// Stripe webhook: index.js must mount raw body for this route
exports.webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    const stripeLib = require('stripe');
    event = stripeLib.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    await Order.findOneAndUpdate({ stripePaymentIntentId: pi.id }, { status: 'paid' });
  }
  res.json({ received: true });
};
