// reference schema
const Services = require("../models/servicesSchema");

// show services (GET)
exports.getServicesPage = async (req, res) => {
  try {
    const services = await Services.find().sort({ createdAt: -1 });
    res.render("servicesmanagement", {
      csrfToken: req.csrfToken(),
      services,
      layout: false
    });
  } catch (err) {
    console.error("Error fetching services:", err);
    res.status(500).send("Error loading services");
  }
};

exports.createService = async (req, res) => {
  try {
    const { serviceName, serviceDescription, buttonText, buttonUrl } = req.body;

    const imageUrl = req.file ? `/public/images/uploads/${req.file.filename}` : null;

    const newService = new Services({
      serviceName,
      serviceDescription,
      buttonText,
      buttonUrl,
      imageUrl
    });

    await newService.save();
    res.redirect('/adminportal/servicesmanagement');
  } catch (err) {
    console.error('Error creating service:', err);
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).send('Image too large (max 5MB).');
    res.status(500).send('Error creating service');
  }
};