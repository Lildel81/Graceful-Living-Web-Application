const express = require('express');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const Passwd = require('../models/Passwd'); // <-- FIX: import the model, not a router

const router = express.Router();

const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req),
});

const createSchema = Joi.object({
  username: Joi.string().min(3).max(64).regex(/^[a-zA-Z0-9._-]+$/).required(),
  email:    Joi.string().email().max(254).required(),
  password: Joi.string().min(8).max(1024).required(),
});

router.post('/', createLimiter, async (req, res) => {
  try {
    const { value, error } = createSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const msg = error.details.map(d => d.message).join('; ');
      return res.status(400).send(`Invalid input: ${msg}`);
    }

    const username = value.username.trim().toLowerCase();
    const email = value.email.trim().toLowerCase();
    const hash = await bcrypt.hash(value.password, 12);

    const user = new Passwd({ username, email, hash });
    await user.save();

    return res.status(201).send('Admin user created successfully.');
  } catch (err) {
    if (err?.code === 11000) {
      const field = Object.keys(err.keyValue || { account: '' })[0];
      return res.status(409).send(`A user with that ${field} already exists.`);
    }
    console.error(err);
    return res.status(500).send('Internal server error.');
  }
});

module.exports = router;
