const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Joi = require('joi');
const { sendResetEmail } = require('../mail/mailer');
const crypto = require('crypto');
const PasswordResetToken = require('../models/passwordResetToken');


const HARD_CODED_RECIPIENT = process.env.RESET_EMAIL_RECIPIENT || 'terry.weatherman8112@gmail.com';

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}


//storing the hashed token here -- protects against leaks from mongoDB
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}



router.post('/request', async (req, res) => {
  try {
    const token = generateToken();
    const tokenHash = hashToken(token);
    const ttlMinutes = 15; // token valid for 15 minutes
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);


await PasswordResetToken.create({
      tokenHash,
      email: HARD_CODED_RECIPIENT,
      expiresAt,
    });

    //const resetURL = `${process.env.PUBLIC_BASE_URL || 'http://localhost:8080'}/reset?token=${token}`;

    const base = process.env.HOST_URL || `http://localhost:${process.env.PORT || 8080}`;
    const resetURL = `${base}/reset/${token}`;   // <-- path style
    console.log('[reset] email link:', resetURL);

    const subject = 'Password Reset Request';
    const html = `
      <p>A password reset was requested (demo).</p>
      <p><strong>Reset link (placeholder):</strong> <a href="${resetURL}">${resetURL}</a></p>
      <p><strong>Token:</strong> ${token}</p>
    `;
    const text = `Reset link (valid ${ttlMinutes} mins): ${resetURL}`;

    const to = process.env.RESET_RECIPIENT || 'shantekumar01@yahoo.com';
    const info = await sendResetEmail({ to, subject, html, text });

    console.log('[mail] messageId:', info.messageId);
    console.log('[mail] accepted:', info.accepted);
    console.log('[mail] rejected:', info.rejected);

    res.json({ ok: true, id: info.messageId, accepted: info.accepted, rejected: info.rejected });
  } catch (err) {
    console.error('[mail] send failed:', err);
    res.status(500).json({ ok: false, error: 'Send failed' });
  }
});


router.get('/request', (req,res)=>res.type('text').send('passwordReset: GET ok'));


module.exports = router;
