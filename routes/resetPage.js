// routes/resetPage.js
const express = require('express');
const router = express.Router();
const Joi = require('joi');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const PasswordResetToken = require('../models/PasswordResetToken');


const mongoose = require('mongoose');
const passwdSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, unique: true },
  hash:     { type: String, required: true },
}, { timestamps: true });
const Passwd = mongoose.models.Passwd || mongoose.model('Passwd', passwdSchema);

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Validate new password
const passwordSchema = Joi.object({
  password: Joi.string().min(8).max(256).required(),
  confirm: Joi.ref('password'),
}).with('password', 'confirm');

router.get('/', (req, res) => {
  const { token } = req.query || {};
  if (token) return res.redirect(`/reset/${encodeURIComponent(token)}`);
  return res.status(404).render('reset-invalid', { title: 'Reset link invalid or expired' });
});

// ----- GET /reset/:token  -> render form if token is valid -----
router.get('/:token', async (req, res) => {
  const { token } = req.params;
  const tokenHash = hashToken(token);
  const now = new Date();

  const t = await PasswordResetToken.findOne({
    tokenHash,
    usedAt: { $exists: false },
    expiresAt: { $gt: now },
  });

  if (!t) {
    // if the token is not good anymore
    return res.status(404).render('reset-invalid', { title: 'Reset link invalid or expired' });
  }

  // Render the password and add the token
  return res.render('reset-password', {
    title: 'Set a new password',
    token,                 // will post to /reset/:token
    minutesLeft: Math.max(1, Math.ceil((t.expiresAt - now) / 60000)),
  });
});

// make sure its one time token use
router.post('/:token', async (req, res) => {
  const { token } = req.params;
  const tokenHash = hashToken(token);
  const now = new Date();

  try {
    
    const t = await PasswordResetToken.findOne({
      tokenHash,
      usedAt: { $exists: false },
      expiresAt: { $gt: now },
    });
    if (!t) {
      return res.status(400).render('reset-invalid', { title: 'Reset link invalid or expired' });
    }

    
    const { error, value } = passwordSchema.validate(req.body, { abortEarly: false });
    if (error) {
      
      return res.status(400).render('reset-password', {
        title: 'Set a new password',
        token,
        minutesLeft: Math.max(1, Math.ceil((t.expiresAt - now) / 60000)),
        errors: error.details.map(d => d.message),
      });
    }

    const newHash = await bcrypt.hash(value.password, 12);

    
    //TODO: need to update the user information here for when we go live
    // Example: 
    // await Passwd.findOneAndUpdate({ username: t.username }, { hash: newHash });

    // because this is a demo
    await Passwd.findOneAndUpdate({ username: 'skumar' }, { hash: newHash });

    // 4) kill the token
    t.usedAt = new Date();
    await t.save();

    return res.render('reset-done', { title: 'Password updated' });
  } catch (e) {
    console.error('[reset] post error:', e);
    return res.status(500).render('reset-invalid', { title: 'Unexpected error' });
  }
});

module.exports = router;
