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
    const hash = await bcrypt.hash(value.password, 12);

    const user = await Passwd.findOne({ username: value.username });
    if (user) {
      const storedHash = user.hash;
      console.log("User exists and hash is: ", storedHash);

      const match = await bcrypt.compare(value.password, storedHash);
        if (match){
          console.log("Password correct");
          return res.redirect('/adminportal');
        } else {
          return res.redirect('/login')
          
          return;
        }
      
    } else {
      console.log("User not found");
    }


    // await Passwd.findOneAndUpdate(
    //   { username: value.username },
    //   { username: value.username, hash },
    //   { upsert: true, new: true, setDefaultsOnInsert: true }
    // );


  } catch (err) {
    console.error('DB error: ', err);
    return res.status(500).send('Database error');
  }
    
});

module.exports = router;

