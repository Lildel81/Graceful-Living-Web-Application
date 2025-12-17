const Joi = require('joi');
const sanitizeHtml = require('sanitize-html');
const Product = require('../models/product');

const { putToS3, deleteFromS3 } = require('../public/js/s3');        
const { safeFilename } = require('../middleware/upload');       

const productSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  slug: Joi.string().min(2).max(200).required(),
  description: Joi.string().allow(''),
  priceCents: Joi.number().integer().min(0).required(),
  stock: Joi.number().integer().min(0).default(0),
  active: Joi.boolean().default(true)
});

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

// --- S3 helpers ---
function publicS3Url(key) {
  return `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

function keyFromPublicS3Url(url) {
  // expects: https://<bucket>.s3.<region>.amazonaws.com/<key>
  try {
    const u = new URL(url);
    return u.pathname.replace(/^\//, '');
  } catch {
    return null;
  }
}

function isOurS3Url(url) {
  return typeof url === 'string' && url.includes('.amazonaws.com/');
}

// =========================
// Public shop pages
// =========================
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

// =========================
// Admin
// =========================
exports.adminForm = async (req, res, next) => {
  try {
    res.render('shop-form', { title: 'New Product', product: {} });
  } catch (e) { next(e); }
};

// Create product (with optional image upload -> S3)
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
      // Joi default(true) applies for active
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

    // Upload image to S3 if provided
    let imagePath = '';
    if (req.file) {
      const filename = safeFilename(req.file.originalname);
      const key = `products/${filename}`;

      await putToS3({
        key,
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
      });

      imagePath = publicS3Url(key);
    }

    const product = new Product({
      ...value,
      currency: 'usd',
      description: sanitizeHtml(value.description || ''),
      imagePath
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

// List all products (including inactive) for admin
exports.adminList = async (req, res, next) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 }).lean();
    res.render('shop-admin-list', { title: 'Manage Products', products });
  } catch (e) { next(e); }
};

// Edit form
exports.adminEditForm = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).render('404', { title: 'Not Found' });
    res.render('shop-edit', { title: `Edit: ${product.title}`, product });
  } catch (e) { next(e); }
};

// Update (no photo change)
exports.adminUpdate = async (req, res, next) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).render('404', { title: 'Not Found' });

    let { title, description, priceCents, priceDollars, stock, active, updateSlug } = req.body;

    if (!priceCents && priceDollars) {
      const d = parseFloat(priceDollars);
      if (Number.isFinite(d) && d >= 0) priceCents = Math.round(d * 100);
    }

    const payload = {
      title: title ?? p.title,
      slug: p.slug, // default keep same
      description,
      priceCents: Number(priceCents ?? p.priceCents),
      stock: (stock === '' || typeof stock === 'undefined') ? p.stock : Number(stock),
      active: typeof active === 'string' ? active === 'on' : !!active,
    };

    if (updateSlug === 'on' && payload.title) {
      payload.slug = await ensureUniqueSlug(toSlug(payload.title));
    }

    const { value, error } = productSchema.validate(payload, { abortEarly: false });
    if (error) {
      const msg = error.details?.map(d => d.message).join('; ') || 'Validation error';
      return res.status(400).render('shop-edit', {
        title: `Edit: ${p.title}`,
        product: { ...(p.toObject?.() ?? p), ...payload },
        error: msg
      });
    }

    p.title = value.title;
    p.slug = value.slug;
    p.description = sanitizeHtml(value.description || '');
    p.priceCents = value.priceCents;
    p.stock = value.stock;
    p.active = value.active;

    await p.save();
    return res.redirect('/shop/admin/list');
  } catch (e) {
    console.error('[SHOP][UPDATE] Failed:', e);
    return res.status(400).render('shop-edit', {
      title: 'Edit Product',
      product: { _id: req.params.id, ...req.body },
      error: e?.message || 'Failed to update product'
    });
  }
};

// Delete product + image (delete S3 object if it was ours)
exports.adminDelete = async (req, res, next) => {
  try {
    const doc = await Product.findByIdAndDelete(req.params.id).lean();

    if (doc && doc.imagePath && isOurS3Url(doc.imagePath)) {
      const key = keyFromPublicS3Url(doc.imagePath);
      if (key) {
        try {
          await deleteFromS3(key);
        } catch (err) {
          console.warn('[SHOP][DELETE] Could not remove S3 image:', key, err.message);
        }
      }
    }

    return res.redirect('/shop/admin/list');
  } catch (e) { next(e); }
};
