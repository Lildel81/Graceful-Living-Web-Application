const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  title: String,
  priceCents: Number,
  quantity: { type: Number, default: 1 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  email: { type: String, required: true },
  items: [orderItemSchema],
  subtotalCents: Number,
  currency: { type: String, default: 'usd' },
  stripePaymentIntentId: { type: String, index: true },
  status: { type: String, enum: ['pending', 'paid', 'failed', 'canceled'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
