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

// insert a new service (POST)
exports.createService = async (req, res) => {
  try {
    const { serviceName, serviceDescription, buttonText, buttonUrl } = req.body;

    const newService = new Services({
      serviceName,
      serviceDescription,
      buttonText,
      buttonUrl,
    });

    await newService.save();
    console.log("Service added:", newService);
    res.redirect("/adminportal/servicesmanagement");
  } catch (err) {
    console.error("Error creating service:", err);
    res.status(500).send("Error creating service");
  }
};