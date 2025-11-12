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

// --- Admin ---
exports.adminForm = async (req, res, next) => {
  try {
    res.render('shop-form', { title: 'New Product', product: {} });
  } catch (e) { next(e); }
};

function toSlug(s = '') {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

async function ensureUniqueSlug(base) {
  let slug = base;
  let i = 2;
  while (await Product.exists({ slug })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

// controllers/shopController.js (adminCreate)
// controllers/shopController.js (inside adminCreate)
exports.adminCreate = async (req, res, next) => {
  try {
    let { title, description, priceCents, priceDollars, stock /* no 'active' from body */ } = req.body;

    if (!priceCents && priceDollars) {
      const d = parseFloat(priceDollars);
      if (Number.isFinite(d) && d >= 0) priceCents = Math.round(d * 100);
    }

    const baseSlug = toSlug(title);
    const slug = await ensureUniqueSlug(baseSlug);

    const payload = {
      title,
      slug,
      description,
      priceCents: Number(priceCents),
      stock: (stock === '' || typeof stock === 'undefined') ? 0 : Number(stock),
      // do not include 'active' here -> Joi default(true) will apply
    };

    const { value, error } = productSchema.validate(payload, { abortEarly: false });
    if (error) {
      const msg = error.details?.map(d => d.message).join('; ') || 'Validation error';
      return res.status(400).render('shop-form', {
        title: 'New Product',
        product: req.body,
        error: msg
      });
    }

    const product = new Product({
      ...value,
      currency: 'usd',
      description: sanitizeHtml(value.description || ''),
      imagePath: req.file ? `/images/uploads/${req.file.filename}` : ''
    });

    await product.save();
    return res.redirect('/shop');
  } catch (e) {
    console.error('[SHOP][CREATE] Failed:', e);
    return res.status(400).render('shop-form', {
      title: 'New Product',
      product: req.body || {},
      error: e?.message || 'Failed to create product'
    });
  }
};
