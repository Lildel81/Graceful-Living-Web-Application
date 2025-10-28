// reference schema
const Services = require("../models/servicesSchema");

const fs = require("fs");
const path = require("path");

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

// create 
exports.createService = async (req, res) => {
  try {
    // count how many services currently exist
    const serviceCount = await Services.countDocuments();
    if (serviceCount >= 3) {
      console.warn("Service limit reached (3)");
      return res.render("servicesmanagement", {
       csrfToken: req.csrfToken(),
       services: await Services.find().sort({ createdAt: -1 }),
       errorMessage: "You can only have a maximum of 3 services.",
       layout: false
      });
    }

    const { serviceName, serviceDescription, buttonText, buttonUrl } = req.body;

    //const imageUrl = req.file ? `/public/images/uploads/${req.file.filename}` : null;
    const imageUrl = req.file ? `/images/uploads/${req.file.filename}` : null;

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

// delete
exports.deleteService = async(req, res) => {
  try{
    // get the id of the service 
    const serviceId = req.params.id;
    const service = await Services.findById(serviceId);

    // check if service we want to delete exists in database 
    if (!service) {
      return res.status(404).send("Service not found");
    }

    // delete the uploaded image file if it exists
    if (service.imageUrl) {
      const imagePath = path.join(__dirname, "..", service.imageUrl);
      fs.unlink(imagePath, (err) => {
        if (err) console.warn("Could not delete image:", err.message);
      });
    }

    await Services.findByIdAndDelete(serviceId);
    res.redirect("/adminportal/servicesmanagement");
  }
  catch(err){
    console.error("Error deleting service:", err);
    res.status(500).send("Error deleting service");
  }
}

// edit 
exports.editService = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const service = await Services.findById(serviceId);

    if (!service) {
      return res.status(404).send("Service not found");
    }

    res.render("editServices", {
      csrfToken: req.csrfToken(),
      service,
      layout: false
    });
  } catch (err) {
    console.error("Error loading edit page:", err);
    res.status(500).send("Error loading edit page");
  }
};

// update 
exports.updateService = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const { serviceName, serviceDescription, buttonText, buttonUrl } = req.body;

    const service = await Services.findById(serviceId);
    if (!service) {
      return res.status(404).send("Service not found");
    }

    // if a new image was uploaded, delete the old one
    if (req.file) {
      if (service.imageUrl) {
        const oldImagePath = path.join(__dirname, "..", service.imageUrl);
        fs.unlink(oldImagePath, (err) => {
          if (err) console.warn("Could not delete old image:", err.message);
        });
      }
      service.imageUrl = `/images/uploads/${req.file.filename}`;
    }

    // update other fields
    service.serviceName = serviceName;
    service.serviceDescription = serviceDescription;
    service.buttonText = buttonText;
    service.buttonUrl = buttonUrl;

    await service.save();
    res.redirect("/adminportal/servicesmanagement");
  } catch (err) {
    console.error("Error updating service:", err);
    res.status(500).send("Error updating service");
  }
  };