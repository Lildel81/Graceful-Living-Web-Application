const nodemailer = require('nodemailer');

//nodemailer.set('logger', true);
//nodemailer.set('debug', true);
const express = require('express');
const router = express.Router();

const provider = process.env.SMTP_PROVIDER || 'gmail';

const transporter = nodemailer.createTransport(
  provider === 'gmail'
    ? {
        service: 'gmail',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        logger: true,
        debug: true,
      }
    : {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false, // true only if you use 465
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        logger: true,
        debug: true,
      }
);

transporter.verify()
  .then(() => console.log('[mail] SMTP verified and ready'))
  .catch(err => console.error('[mail] SMTP verify failed:', err));

async function sendResetEmail({ to, subject, html, text }) {
  return transporter.sendMail({
    from: process.env.MAIL_FROM || '"Graceful Living" <no-reply@gracefulliving.app>',
    to,
    subject,
    text,
    html,
  });
}
module.exports = { sendResetEmail };