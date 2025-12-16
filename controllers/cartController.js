const Joi = require('joi');
const sanitizeHtml = require('sanitize-html');
const Product = require('../models/product');

const productSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  slug: Joi.string().min(2).max(200).required(),
  description: Joi.string().allow(''),
  priceCents: Joi.number().integer().min(0).required(),
  stock: Joi.number().integer().min(0).default(0),
  active: Joi.boolean().default(true)
});

exports.listProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ active: true }).lean();
    res.render('shop', { title: 'Shop', products });
  } catch (e) { next(e); }
};

exports.showProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, active: true }).lean();
    if (!product) return res.status(404).render('404', { title: 'Not Found' });
    res.render('shop-show', { title: product.title, product });
  } catch (e) { next(e); }
};

// --- Admin (optional basic create) ---
exports.adminForm = async (req, res, next) => {
  try {
    res.render('shop-form', { title: 'New Product', product: {} });
  } catch (e) { next(e); }
};

exports.adminCreate = async (req, res, next) => {
  try {
    const { value, error } = productSchema.validate(req.body);
    if (error) throw error;

    const product = new Product({
      ...value,
      description: sanitizeHtml(value.description || ''),
      imagePath: req.file ? `/var/data/${req.file.filename}` : ''
    });
    await product.save();
    res.redirect('/shop');
  } catch (e) { next(e); }
};



function initCart(req) {
  if (!req.session.cart) req.session.cart = { items: {}, count: 0, subtotalCents: 0 };
  return req.session.cart;
}

async function addToCart(req, res, next) {
  try {
    const product = await Product.findById(req.body.productId).lean();
    if (!product || !product.active) return res.status(404).send('Product not found');

    const cart = initCart(req);
    const key = String(product._id);
    cart.items[key] = cart.items[key] || { productId: key, title: product.title, priceCents: product.priceCents, qty: 0 };
    cart.items[key].qty += Number(req.body.qty || 1);

    cart.count = Object.values(cart.items).reduce((a, i) => a + i.qty, 0);
    cart.subtotalCents = Object.values(cart.items).reduce((a, i) => a + i.qty * i.priceCents, 0);

    res.redirect('/cart');
  } catch (e) { next(e); }
}

function viewCart(req, res) {
  const cart = req.session.cart || { items: {}, count: 0, subtotalCents: 0 };
  res.render('cart', { title: 'Your Cart', cart });
}

function removeFromCart(req, res) {
  const cart = req.session.cart || { items: {}, count: 0, subtotalCents: 0 };
  delete cart.items[req.params.id];
  cart.count = Object.values(cart.items).reduce((a, i) => a + i.qty, 0);
  cart.subtotalCents = Object.values(cart.items).reduce((a, i) => a + i.qty * i.priceCents, 0);
  res.redirect('/cart');
}

module.exports = { viewCart, addToCart, removeFromCart };