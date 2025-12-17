// reference schema
const Services = require("../models/servicesSchema");
const path = require("path");

const { putToS3, deleteFromS3 } = require("../public/js/s3"); 
const { safeFilename } = require("../middleware/upload"); 
function keyFromPublicS3Url(url) {
  // Expects: https://<bucket>.s3.<region>.amazonaws.com/<key>
  try {
    const u = new URL(url);
    return u.pathname.replace(/^\//, ""); // strip leading "/"
  } catch {
    return null;
  }
}

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

    let imageUrl = null;

    if (req.file) {
      const filename = safeFilename(req.file.originalname);
      const key = `services/${filename}`;

      await putToS3({
        key,
        buffer: req.file.buffer,
        contentType: req.file.mimetype
      });

      // public URL stored in Mongo
      imageUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }

    const newService = new Services({
      serviceName,
      serviceDescription,
      buttonText,
      buttonUrl,
      imageUrl
    });

    await newService.save();
    res.redirect("/adminportal/servicesmanagement");
  } catch (err) {
    console.error("Error creating service:", err);
    if (err.code === "LIMIT_FILE_SIZE") return res.status(400).send("Image too large.");
    res.status(500).send("Error creating service");
  }
};

// delete
exports.deleteService = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const service = await Services.findById(serviceId);

    if (!service) return res.status(404).send("Service not found");

    // delete from S3 if it's one of our uploaded objects
    if (service.imageUrl && service.imageUrl.includes(".amazonaws.com/")) {
      const key = keyFromPublicS3Url(service.imageUrl);
      if (key) {
        try {
          await deleteFromS3(key);
        } catch (err) {
          console.warn("Could not delete S3 image:", key, err.message);
        }
      }
    }

    await Services.findByIdAndDelete(serviceId);
    res.redirect("/adminportal/servicesmanagement");
  } catch (err) {
    console.error("Error deleting service:", err);
    res.status(500).send("Error deleting service");
  }
};

// edit (renders page)
exports.editService = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const service = await Services.findById(serviceId);

    if (!service) return res.status(404).send("Service not found");

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
    if (!service) return res.status(404).send("Service not found");

    // if a new image was uploaded, delete the old one from S3 and upload the new one
    if (req.file) {
      // delete old
      if (service.imageUrl && service.imageUrl.includes(".amazonaws.com/")) {
        const oldKey = keyFromPublicS3Url(service.imageUrl);
        if (oldKey) {
          try {
            await deleteFromS3(oldKey);
          } catch (err) {
            console.warn("Could not delete old S3 image:", oldKey, err.message);
          }
        }
      }

      // upload new
      const filename = safeFilename(req.file.originalname);
      const key = `services/${filename}`;

      await putToS3({
        key,
        buffer: req.file.buffer,
        contentType: req.file.mimetype
      });

      service.imageUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
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
