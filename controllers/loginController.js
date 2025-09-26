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
  { timestamps: true }
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

    const user = await Passwd.findOne({ username: value.username });
    if (!user) {
  return res.status(401).json({ ok: false, error: 'invalid credentials' });
    }

    

    const match = await bcrypt.compare(value.password, user.hash);
    if (!match) {
  return res.status(401).json({ ok: false, error: 'invalid credentials' });
    }

    req.session.regenerate(err => {
      if (err) return res.status(500).send('session error');

      req.session.isAdmin = true;
      req.session.username = user.username;

      const redirectTo = req.session.returnTo || '/adminportal';
      delete req.session.returnTo;

      req.session.save(err2 => {
        if (err2) return res.status(500).send('session save error');
        return res.redirect(redirectTo);
      });
    });
  }catch (e) {
    console.error('DB error: ', e);
    return res.status(500).send('Database error');
  }

    // const hash = await bcrypt.hash(value.password, 12);

    // const user = await Passwd.findOne({ username: value.username });
    // if (user) {
    //   const storedHash = user.hash;
    //   console.log("User exists and hash is: ", storedHash);

    //   const match = await bcrypt.compare(value.password, storedHash);
    //     if (match){
    //       console.log("Password correct");
    //       req.session.regenerate(err => {
    //         if (err) return res.status(500).send('session error');

    //         req.session.isAdmin = true;
    //         req.session.username = user.username;

    //         const redirectTo = req.session.returnTo || '/adminportal';
    //         delete req.session.returnTo;

    //         req.session.save(err2 => {
    //           if (err2) return res.status(500).send('session save error');
    //           res.redirect(redirectTo);
    //         });
    //       });

    //       res.json({ ok: true });
    //       return res.redirect('/adminportal');
    //     } else {
    //       return res.redirect('/login')
          
    //       return;
    //     }
      
    // } else {
      console.log("User not found");
    });


    // await Passwd.findOneAndUpdate(
    //   { username: value.username },
    //   { username: value.username, hash },
    //   { upsert: true, new: true, setDefaultsOnInsert: true }
    // );




module.exports = router;

