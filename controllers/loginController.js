const express = require('express');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const router = express.Router();

/* ---------- Inline model with lockout fields ---------- */
const passwdSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true, unique: true },
    hash:     { type: String, required: true },

    // lockout controls
    failedLoginCount: { type: Number, default: 0 },
    failWindowStart:  { type: Date,   default: null }, // start of the 15-min window
    lockUntil:        { type: Date,   default: null }, // when login is allowed again
  },
  { timestamps: true }
);

passwdSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

const Passwd = mongoose.models.Passwd || mongoose.model('Passwd', passwdSchema);

/* ---------- Validation (only what the form sends) ---------- */
const formSchema = Joi.object({
  username: Joi.string().min(3).max(254).required(),
  password: Joi.string().min(1).required(),
});

/* ---------- Per-IP+username rate limit: 5 failed / 15 min ---------- */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only 4xx/5xx count as failures
  //keyGenerator: (req) => `${req.ip}:${(req.body.username || '').toLowerCase()}`,
  keyGenerator: (req, res) => ipKeyGenerator(req),
  handler: (req, res) => {
    return res.status(429).render('login', {
      ok: false,
      error: 'Too many failed login attempts. Try again in 15 minutes.',
      username: req.body.username || ''
    });
  },
});

/* ---------- Lockout policy ---------- */
const MAX_FAILS = 5;                 // 5 tries
const WINDOW_MS = 15 * 60 * 1000;    // 15 minutes rolling window
const LOCK_MS   = 15 * 60 * 1000;    // 15 minutes lock

/* ---------- GET /login ---------- */
router.get('/', (req, res) => {
  res.render('login', { ok: req.query.ok || false, error: null, username: '' });
});

/* ---------- POST /login ---------- */
router.post('/', loginLimiter, async (req, res) => {
  const { error, value } = formSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).render('login', {
      ok: false,
      error: 'Please fill in both fields.',
      username: req.body.username || ''
    });
  }

  try {
    const user = await Passwd.findOne({ username: value.username });

    // Uniform error to avoid enumeration
    if (!user) {
      return res.status(401).render('login', {
        ok: false,
        error: 'Invalid username or password.',
        username: value.username
      });
    }

    // HARD GATE: block ALL attempts while locked (even correct passwords)
    if (user.isLocked()) {
      const minutes = Math.max(1, Math.ceil((user.lockUntil - Date.now()) / 60000));
      return res.status(429).render('login', {
        ok: false,
        error: `Too many failed attempts. Try again in ${minutes} minute(s).`,
        username: value.username
      });
    }

    // Check password
    const match = await bcrypt.compare(value.password, user.hash);
    if (!match) {
      const now = Date.now();
      let failed = user.failedLoginCount || 0;
      let windowStart = user.failWindowStart;

      // Start/roll the 15-minute window
      if (!windowStart || now - windowStart.getTime() > WINDOW_MS) {
        failed = 1;
        windowStart = new Date(now);
      } else {
        failed += 1;
      }

      if (failed >= MAX_FAILS) {
        // Lock account
        await Passwd.updateOne(
          { _id: user._id },
          { $set: { failedLoginCount: 0, failWindowStart: null, lockUntil: new Date(now + LOCK_MS) } }
        );
        return res.status(429).render('login', {
          ok: false,
          error: 'Too many failed attempts. Try again in 15 minutes.',
          username: value.username
        });
      } else {
        // Save counters and return 401
        await Passwd.updateOne(
          { _id: user._id },
          { $set: { failedLoginCount: failed, failWindowStart: windowStart } }
        );
        return res.status(401).render('login', {
          ok: false,
          error: 'Invalid username or password.',
          username: value.username
        });
      }
    }

    // SUCCESS: reset counters + clear lock, then log in
    await Passwd.updateOne(
      { _id: user._id },
      { $set: { failedLoginCount: 0, failWindowStart: null, lockUntil: null } }
    );

    req.session.regenerate(err => {
      if (err) {
        return res.status(500).render('login', {
          ok: false,
          error: 'Session error. Please try again.',
          username: value.username
        });
      }

      req.session.isAdmin = true; // keep if appropriate
      req.session.username = user.username;

      const redirectTo = req.session.returnTo || '/adminportal';
      delete req.session.returnTo;

      req.session.save(err2 => {
        if (err2) {
          return res.status(500).render('login', {
            ok: false,
            error: 'Session save error. Please try again.',
            username: value.username
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
      username: req.body.username || ''
    });
  }
});

module.exports = router;
module.exports.Passwd = Passwd;

