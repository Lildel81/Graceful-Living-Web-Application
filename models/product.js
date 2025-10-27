const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  description: { type: String, default: '' },
  priceCents: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'usd' },
  imagePath: { type: String, default: '' },
  stock: { type: Number, default: 0, min: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
