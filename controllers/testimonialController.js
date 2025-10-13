// controllers/testimonialController.js
const Testimonial = require('../models/testimonialSchema');

// List (admin)
const listTestimonials = async (req, res) => {
  try {
    const items = await Testimonial.find().sort({ _id: -1 }).lean();

    // success banner from query flags
    let ok = false;
    let action = '';
    if (req.query.created) { ok = true; action = 'created'; }
    if (req.query.updated) { ok = true; action = 'updated'; }
    if (req.query.deleted) { ok = true; action = 'deleted'; }

    // render without the public site layout (no header/mountain bg)
    res.render('testimonials-manage', { layout: false, items, ok, action });
  } catch (e) {
    console.error('Failed to load testimonials:', e);
    res.status(500).send('Failed to load testimonials');
  }
};

// Create form
const getCreateTestimonial = (req, res) => {
  res.render('testimonials-form', { layout: false, mode: 'create', item: {}, formError: null });
};

// Create submit
const postCreateTestimonial = async (req, res) => {
  try {
    const payload = {
      name: (req.body.name || '').trim(),
      quote: (req.body.quote || '').trim(),
      location: (req.body.location || '').trim(),
      event: (req.body.event || '').trim(),
    };
    if (!payload.name || !payload.quote) {
      return res.status(400).render('testimonials-form', {
        layout: false,
        mode: 'create',
        item: payload,
        formError: 'Name and Quote are required.'
      });
    }
    await Testimonial.create(payload);
    return res.redirect('/admin/testimonials?created=1');
  } catch (e) {
    console.error('Create failed:', e);
    res.status(500).render('testimonials-form', {
      layout: false,
      mode: 'create',
      item: req.body,
      formError: 'Failed to create testimonial.'
    });
  }
};

// Edit form
const getEditTestimonial = async (req, res) => {
  try {
    const item = await Testimonial.findById(req.params.id).lean();
    if (!item) return res.status(404).send('Not found');
    res.render('testimonials-form', { layout: false, mode: 'edit', item, formError: null });
  } catch (err) {
    console.error('Error loading testimonial edit form:', err);
    res.status(500).send('Error loading testimonial');
  }
};


// Update submit
const postUpdateTestimonial = async (req, res) => {
  try {
    const payload = {
      name: (req.body.name || '').trim(),
      quote: (req.body.quote || '').trim(),
      location: (req.body.location || '').trim(),
      event: (req.body.event || '').trim(),
    };
    if (!payload.name || !payload.quote) {
      return res.status(400).render('testimonials-form', {
        layout: false,
        mode: 'edit',
        item: { ...payload, _id: req.params.id },
        formError: 'Name and Quote are required.'
      });
    }
    await Testimonial.findByIdAndUpdate(req.params.id, payload, { runValidators: true });
    return res.redirect('/admin/testimonials?updated=1');
  } catch (e) {
    console.error('Update failed:', e);
    res.status(500).render('testimonials-form', {
      layout: false,
      mode: 'edit',
      item: { ...req.body, _id: req.params.id },
      formError: 'Failed to update testimonial.'
    });
  }
};

// Delete
const postDeleteTestimonial = async (req, res) => {
  try {
    await Testimonial.findByIdAndDelete(req.params.id);
    return res.redirect('/admin/testimonials?deleted=1');
  } catch (e) {
    console.error('Delete failed:', e);
    res.status(500).send('Failed to delete testimonial');
  }
};

module.exports = {
  listTestimonials,
  getCreateTestimonial,
  postCreateTestimonial,
  getEditTestimonial,
  postUpdateTestimonial,
  postDeleteTestimonial,
};



