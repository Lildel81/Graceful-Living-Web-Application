const express = require('express');
const router = express.Router();
const Application = require('../models/appSchema'); 

function buildFilter(qs) {
    // filters 
    const{
        q, ageBracket, isHealthcareWorker, workedWithPractitioner,
        familiarWith, challenges, from, to   
    }=qs;

    const filter = {}; 

    // search bar search
    if(q) {
        const rx = new RegExp(q, 'i');
        filter.$or = [{ fullName: rx }, { email: rx }, { contactNumber: rx }, { jobTitle: rx }];
    }

    if (ageBracket) filter.ageBracket = ageBracket;
    if (isHealthcareWorker) filter.isHealthcareWorker = isHealthcareWorker;
    if (workedWithPractitioner) filter.workedWithPractitioner = workedWithPractitioner;

    // make the multi-select values an array 
    const toArr = (v) => (Array.isArray(v) ? v : v ? [v] : []);

    const fam = toArr(familiarWith);
    if (fam.length) filter.familiarWith = { $all: fam };

    const chal = toArr(challenges);
    if (chal.length) filter.challenges = { $all: chal };

    // date filter 
    if (from || to) {
        filter.submittedAt = {};
        if (from) filter.submittedAt.$gte = new Date(from);
        if (to) {
            const d = new Date(to);
            d.setHours(23, 59, 59, 999);
            filter.submittedAt.$lte = d;
        }
    }
    return filter; 
}

// Get route for a MongoDB query
router.get('/clientmanagement/applications', async (req, res, next) => {
  try {
    const filter = buildFilter(req.query);

    // Sort newest first
    const rows = await Application.find(filter).sort({ submittedAt: -1 }).lean();

    // get total number of submissions
    const stats = {
      total: rows.length
    };

    // get the rows and stats 
    res.render('prequiz-results', {
      title: 'Pre-Applications Results ',
      rows,
      stats,
      q: req.query.q || '',
      ageBracket: req.query.ageBracket || '',
      isHealthcareWorker: req.query.isHealthcareWorker || '',
      workedWithPractitioner: req.query.workedWithPractitioner || '',
      familiarWith: ([]).concat(req.query.familiarWith || []),
      challenges: ([]).concat(req.query.challenges || []),
      from: req.query.from || '',
      to: req.query.to || ''
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;