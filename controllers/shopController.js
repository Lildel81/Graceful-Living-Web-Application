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
    //const token = typeof req.csrfToken === 'function' ? req.csrfToken() : '';
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
      imagePath: req.file ? `/images/uploads/${req.file.filename}` : ''
    });
    await product.save();
    res.redirect('/shop');
  } catch (e) { next(e); }
};
