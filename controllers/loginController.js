const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Joi = require('joi');
const bcrypt = require('bcrypt');

// schema for database storing password and hash.
const passwdSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true, unique: true },
    hash:     {type: String, required: true },
  },
  { timestamp: true }
);

const Passwd = mongoose.models.Passwd || mongoose.model('Passwd', passwdSchema);

const formSchema = Joi.object({
  username: Joi.string().min(3).max(254).required(),
  password: Joi.string().min(1).required(),
});

router.post('/', async (req, res) => {
  const { error, value } = formSchema.validate(req.body, {abortEarly: false });
  if (error) {
    return res.status(400).send('Invalid input: ' + error.details.map(d => d.message).join(', '));
  }

  try {
    const hash = await bcrypt.hash(value.password, 12);

    await Passwd.findOneAndUpdate(
      { username: value.username },
      { username: value.username, hash },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.redirect('/login?ok=1');
  } catch (err) {
    console.error('DB error: ', err);
    return res.status(500).send('Database error');
  }
    
});

module.exports = router;

