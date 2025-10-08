const express = require('express');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const router = express.Router();

const DUMMY_BCRYPT_HASH = '$2b$12$C0M7X0I1k2aUPq2m4i2WfOo5sM0m2kG1VhSWas6yOqB0W3zJ5r0H6';

/* ---------- model ---------- */
const passwdSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, unique: true },
  hash:     { type: String, required: true },
  failedLoginCount: { type: Number, default: 0 },
  failWindowStart:  { type: Date,   default: null },
  lockUntil:        { type: Date,   default: null },
}, { timestamps: true });

passwdSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

const Passwd = mongoose.models.Passwd || mongoose.model('Passwd', passwdSchema);

/* ---------- validation ---------- */
const formSchema = Joi.object({
  username: Joi.string().custom((v) => v.normalize('NFKC')).trim()
    .min(3).max(64).pattern(/^[A-Za-z0-9._-]+$/).required(),
  password: Joi.string().min(1).max(72).required(),
}).prefs({ abortEarly: false, stripUnknown: true });

/* ---------- rate limit ---------- */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${req.ip}:${(req.body.username || '').toLowerCase()}`,
  handler: (req, res) => {
    return res.status(429).render('login', {
      ok: false,
      error: 'Too many failed login attempts. Try again in 15 minutes.',
      username: req.body.username || '',
      csrfToken: req.csrfToken(),          // <-- add token
    });
  },
});

/* ---------- GET /login ---------- */
router.get('/', (req, res) => {
  // res.locals.csrfToken is already set by your GET middleware,
  // but passing explicitly is fine too:
  res.render('login', {
    ok: req.query.ok || false,
    error: null,
    username: '',
    csrfToken: req.csrfToken(),            // <-- optional but safe
  });
});

/* ---------- POST /login ---------- */
router.post('/', loginLimiter, async (req, res) => {
  const { error, value } = formSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).render('login', {
      ok: false,
      error: 'Please fill in both fields.',
      username: req.body.username || '',
      csrfToken: req.csrfToken(),          // <-- add token
    });
  }

  try {
    const user = await Passwd.findOne({ username: value.username });

    if (!user) {
      await bcrypt.compare(value.password, DUMMY_BCRYPT_HASH);
      return res.status(401).render('login', {
        ok: false,
        error: 'Invalid username or password.',
        username: value.username,
        csrfToken: req.csrfToken(),        // <-- add token
      });
    }

    if (user.isLocked()) {
      const minutes = Math.max(1, Math.ceil((user.lockUntil - Date.now()) / 60000));
      return res.status(429).render('login', {
        ok: false,
        error: `Too many failed attempts. Try again in ${minutes} minute(s).`,
        username: value.username,
        csrfToken: req.csrfToken(),        // <-- add token
      });
    }

    const match = await bcrypt.compare(value.password, user.hash);
    if (!match) {
      const now = Date.now();
      let failed = user.failedLoginCount || 0;
      let windowStart = user.failWindowStart;

      if (!windowStart || now - windowStart.getTime() > 15 * 60 * 1000) {
        failed = 1;
        windowStart = new Date(now);
      } else {
        failed += 1;
      }

      if (failed >= 5) {
        await Passwd.updateOne(
          { _id: user._id },
          { $set: { failedLoginCount: 0, failWindowStart: null, lockUntil: new Date(now + 15 * 60 * 1000) } }
        );
        return res.status(429).render('login', {
          ok: false,
          error: 'Too many failed attempts. Try again in 15 minutes.',
          username: value.username,
          csrfToken: req.csrfToken(),      // <-- add token
        });
      } else {
        await Passwd.updateOne(
          { _id: user._id },
          { $set: { failedLoginCount: failed, failWindowStart: windowStart } }
        );
        return res.status(401).render('login', {
          ok: false,
          error: 'Invalid username or password.',
          username: value.username,
          csrfToken: req.csrfToken(),      // <-- add token
        });
      }
    }

    await Passwd.updateOne(
      { _id: user._id },
      { $set: { failedLoginCount: 0, failWindowStart: null, lockUntil: null } }
    );

    req.session.regenerate(err => {
      if (err) {
        return res.status(500).render('login', {
          ok: false,
          error: 'Session error. Please try again.',
          username: value.username,
          csrfToken: req.csrfToken(),      // <-- add token
        });
      }

      req.session.isAdmin = true;
      req.session.username = user.username;

      const redirectTo = safeRedirectPath(req.session.returnTo);
      delete req.session.returnTo;

      req.session.save(err2 => {
        if (err2) {
          return res.status(500).render('login', {
            ok: false,
            error: 'Session save error. Please try again.',
            username: value.username,
            csrfToken: req.csrfToken(),    // <-- add token
          });
        }
        return res.redirect(redirectTo);
      });
    });
  } catch (e) {
    console.error('Login DB error:', e);
    return res.status(500).render('login', {
      ok: false,
      error: 'Unexpected error. Please try again.',
      username: req.body.username || '',
      csrfToken: req.csrfToken(),          // <-- add token
    });
  }
});

function safeRedirectPath(p) {
  try {
    if (!p || typeof p !== 'string') return '/adminportal';
    if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('//')) return '/adminportal';
    if (!p.startsWith('/')) return '/adminportal';
    return p;
  } catch {
    return '/adminportal';
  }
}

module.exports = router;
module.exports.Passwd = Passwd;
