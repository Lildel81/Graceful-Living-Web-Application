// controllers/testimonialController.js
const Testimonial = require('../models/testimonialSchema');
const csrfProtection = require('../middleware/csrf');

// List (admin)
const listTestimonials = async (req, res) => {
  try {
    const items = await Testimonial.find().sort({ _id: -1 }).lean();

    // success banner from query flags
    let success = '';
    if (req.query.created) success = 'Testimonial created successfully.';
    if (req.query.updated) success = 'Testimonial updated successfully.';
    if (req.query.deleted) success = 'Testimonial deleted successfully.';

    res.render('testimonials-manage', csrfProtection,{
      layout: false,
      items,
      success,
      csrfToken: (req.csrfToken && req.csrfToken()) || null,
    });
  } catch (e) {
    console.error('Failed to load testimonials:', e);
    res.status(500).send('Failed to load testimonials');
  }
};

// Create form
const getCreateTestimonial = (req, res) => {
  res.render('testimonials-form', csrfProtection,{
    layout: false,
    mode: 'create',
    item: {},
    formError: null,
    csrfToken: (req.csrfToken && req.csrfToken()) || null,
  });
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
      return res.status(400).render('testimonials-form', csrfProtection,{
        layout: false,
        mode: 'create',
        item: payload,
        formError: 'Name and Quote are required.',
        csrfToken: (req.csrfToken && req.csrfToken()) || null,
      });
    }
    await Testimonial.create(payload);
    return res.redirect('/admin/testimonials?created=1');
  } catch (e) {
    console.error('Create failed:', e);
    res.status(500).render('testimonials-form', csrfProtection,{
      layout: false,
      mode: 'create',
      item: req.body,
      formError: 'Failed to create testimonial.',
      csrfToken: (req.csrfToken && req.csrfToken()) || null,
    });
  }
};

// Edit form
const getEditTestimonial = async (req, res) => {
  try {
    const item = await Testimonial.findById(req.params.id).lean();
    if (!item) return res.status(404).send('Not found');
    res.render('testimonials-form', csrfProtection,{
      layout: false,
      mode: 'edit',
      item,
      formError: null,
      csrfToken: (req.csrfToken && req.csrfToken()) || null,
    });
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
      return res.status(400).render('testimonials-form', csrfProtection,{
        layout: false,
        mode: 'edit',
        item: { ...payload, _id: req.params.id },
        formError: 'Name and Quote are required.',
        csrfToken: (req.csrfToken && req.csrfToken()) || null,
      });
    }
    await Testimonial.findByIdAndUpdate(req.params.id, payload, { runValidators: true });
    return res.redirect('/admin/testimonials?updated=1');
  } catch (e) {
    console.error('Update failed:', e);
    res.status(500).render('testimonials-form', csrfProtection,{
      layout: false,
      mode: 'edit',
      item: { ...req.body, _id: req.params.id },
      formError: 'Failed to update testimonial.',
      csrfToken: (req.csrfToken && req.csrfToken()) || null,
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




