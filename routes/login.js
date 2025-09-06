// const express = require('express');
// const router = express.Router();
// const Joi = require('joi');
// const bcrypt = require('bcryptjs');
// const HashedPassword = require('../models/passwdSchema');

// const loginSchema = Joi.object({
//     name: Joi.string().min(3).max(64).required(),
//     password: Joi.string().min(8).max(1024).required(),

// });

// router.post('/', async (req, res) => {
//     const { error, value } = passwordSchema.validate(req.body);
//     if (error) return res.status(400).json({ok: false, message: error.details[0].message });

//     const { name, password } = value;

//     const user = await HashedPassword.findOne({ name });
//     if (!user) return res.status(401).json({ok: false, message: "Invalid Credentials" });

//     const match = await bcrypt.compare(password, user.hash);
//     if (!match) return res.status(401).json({ ok: false, message: "Invalid Credentials" });

//     return res.json({ ok: true, message: "Login Successful" });
// });

// module.exports = router;