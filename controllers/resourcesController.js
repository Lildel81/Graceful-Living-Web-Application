/*const ResourcesImage = require('../models/resourcesImage');
const ResourcesText = require('../models/resourcesText');

// show all resource images
const getResourcesManagement = async (req, res) => {
  try {
    const resources = await ResourcesImage.find().sort({ createdAt: -1 });
    const resourcesText = await getOrCreateResourcesText();

    res.render('resourcesmanagement', { 
      csrfToken: req.csrfToken(),
      resources,
      resourcesText,
      layout: false
    });
  } catch (err) {
    console.error("Error loading resources management:", err);
    res.status(500).send("Error loading resources management");
  }
};

// TEXT AT TOP OF RESOURCES PAGE

// show text or create default text 
async function getOrCreateResourcesText() {
  let text = await ResourcesText.findOne();
  if (!text) {
    text = await ResourcesText.create({
      title: "Resources",
      paragraphs: [
        "Welcome to our treasure trove of free resources where the possibilities are as boundless as your imagination!"
      ],
      videoUrl: "https://youtu.be/LKa0ABbkGrQ"
    });
  }
  return text;
}

// helper: normalize to embed url
function normalizeYouTubeUrl(url) {
  if (!url) return null;

  // Convert youtu.be short links
  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1].split("?")[0];
    return `https://www.youtube.com/embed/${id}`;
  }

  // Convert normal youtube.com/watch?v= links
  if (url.includes("watch?v=")) {
    const id = url.split("watch?v=")[1].split("&")[0];
    return `https://www.youtube.com/embed/${id}`;
  }

  return url; // fallback if already embed format
}

// update text 
const updateResourcesText = async (req, res) => {
  try {
    const { title, paragraphs, videoUrl } = req.body;
    let text = await ResourcesText.findOne();

    const normalizedVideoUrl = normalizeYouTubeUrl(videoUrl) 
      || "https://www.youtube.com/embed/LKa0ABbkGrQ"; // fallback

    if (!text) {
      text = new ResourcesText({ 
        title, 
        paragraphs: Array.isArray(paragraphs) ? paragraphs.filter(p => p.trim() !== "") : [],
        videoUrl: normalizedVideoUrl
      });
    } else {
      text.title = title;
      text.paragraphs = Array.isArray(paragraphs) ? paragraphs.filter(p => p.trim() !== "") : [];
      text.videoUrl = normalizedVideoUrl;
      text.updatedAt = Date.now();
    }

    await text.save();

    res.redirect("/adminportal/resourcesmanagement");
  } catch (err) {
    console.error("Error updating resources text:", err);
    res.status(500).send("Error updating resources text");
  }
};

// IMAGES IN RESOURCES

// add new resource image
const createResourcesImage = async (req, res) => {
  const { imageOption, imageUrl, overlayText, buttonText, buttonUrl } = req.body;

  // check how many resources exist. can only have max 3
  const count = await ResourcesImage.countDocuments();
  if (count >= 3) {
    return res.redirect('/adminportal/resourcesmanagement?error=max');
  }

  let imagePath = imageUrl;
  if (imageOption === 'upload' && req.file) {
    imagePath = `/images/uploads/${req.file.filename}`;
  } else if (!imageUrl) {
    imagePath = '/images/default-fallback.jpg';
  }

  await ResourcesImage.create({
    imageUrl: imagePath,
    overlayText,
    buttonText,
    buttonUrl
  });

  res.redirect("/adminportal/resourcesmanagement");
};

// delete resource image
const deleteResourcesImage = async (req, res) => {
  const id = req.params.id;
  await ResourcesImage.findByIdAndDelete(id);

  res.redirect("/adminportal/resourcesmanagement");
};

// edit resource image page
const getEditResourcesImageView = async (req, res) => {
  const resource = await ResourcesImage.findById(req.params.id);
  res.render('editresourcesimage', { 
    csrfToken: req.csrfToken(),
    resource,
    layout: false
  });
};

// update resource image
const editResourcesImage = async (req, res) => {
  try {
    // debug logs 
    // console.log("REQ BODY:", req.body);
    // console.log("REQ FILE:", req.file);

    const { overlayText, buttonText, buttonUrl } = req.body || {};
    let { imageOption, imageUrl } = req.body || {};

    const updateData = {
      overlayText,
      buttonText,
      buttonUrl
    };

    // if user uploaded a file but didn’t select "upload"
    if (!imageOption && req.file) {
      imageOption = "upload";
    }

    // only update image if admin provided one
    if (imageOption === 'upload' && req.file) {
      updateData.imageUrl = `/images/uploads/${req.file.filename}`;
    } else if (imageOption === 'url' && imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    // otherwise, imageUrl stays the same

    await ResourcesImage.findByIdAndUpdate(req.params.id, updateData);

    res.redirect("/adminportal/resourcesmanagement");
  } catch (err) {
    console.error("Error editing resource image:", err);
    res.status(500).send("Error editing resource image");
  }
};

module.exports = {
  getResourcesManagement,
  getOrCreateResourcesText,
  normalizeYouTubeUrl,
  updateResourcesText,
  createResourcesImage,
  deleteResourcesImage,
  getEditResourcesImageView,
  editResourcesImage
};
*/

// reference schemas
const ResourcesImage = require("../models/resourcesImage");
const ResourcesText = require("../models/resourcesText");

const fs = require("fs");
const path = require("path");

/* ===========================================================
    GET FULL RESOURCES MANAGEMENT PAGE
=========================================================== */
exports.getResourcesManagement = async (req, res) => {
  try {
    const images = await ResourcesImage.find().sort({ createdAt: -1 });
    const text = await ResourcesText.findOne();

    res.render("resourcesmanagement", {
      csrfToken: req.csrfToken(),
      resources: images,
      resourcesText: text,
      layout: false
    });
  } catch (err) {
    console.error("Error loading Resources Management page:", err);
    res.status(500).send("Error loading Resources Management page");
  }
};

/* ===========================================================
    RESOURCES TEXT (SINGLE DOCUMENT)
=========================================================== */

// create or fallback for first-time setup
exports.createDefaultText = async () => {
  const exists = await ResourcesText.findOne();
  if (!exists) {
    await new ResourcesText({
      title: "Resources",
      paragraphs: [
        "Welcome to our treasure trove of free resources where the possibilities are as boundless as your imagination!"
      ],
      videoUrl: "https://www.youtube.com/embed/LKa0ABbkGrQ"
    }).save();
  }
};

// normalize YouTube URL to embed format
function normalizeYouTubeUrl(url) {
  if (!url) return null;

  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1].split("?")[0];
    return `https://www.youtube.com/embed/${id}`;
  }

  if (url.includes("watch?v=")) {
    const id = url.split("watch?v=")[1].split("&")[0];
    return `https://www.youtube.com/embed/${id}`;
  }

  return url;
}

// update resources text
exports.updateResourcesText = async (req, res) => {
  try {
    let text = await ResourcesText.findOne();
    const { title, videoUrl } = req.body;

    // Accept both paragraphs and paragraphs[]
    let paragraphs = req.body.paragraphs || req.body["paragraphs[]"];

    // Normalize into array
    if (!Array.isArray(paragraphs)) {
      paragraphs = paragraphs ? [paragraphs] : [];
    }

    const cleanParagraphs = paragraphs
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const normalizedVideoUrl =
      normalizeYouTubeUrl(videoUrl) ||
      "https://www.youtube.com/embed/LKa0ABbkGrQ";

    if (!text) {
      text = new ResourcesText({
        title,
        paragraphs: cleanParagraphs,
        videoUrl: normalizedVideoUrl
      });
    } else {
      text.title = title;
      text.paragraphs = cleanParagraphs;
      text.videoUrl = normalizedVideoUrl;
      text.updatedAt = Date.now();
    }

    await text.save();
    res.redirect("/adminportal/resourcesmanagement");
  } catch (err) {
    console.error("Error updating Resources text:", err);
    res.status(500).send("Error updating Resources text");
  }
};


/* ===========================================================
    RESOURCES IMAGE CRUD
=========================================================== */

// CREATE
exports.createResourcesImage = async (req, res) => {
  try {
    // enforce max limit of 3 images
    const count = await ResourcesImage.countDocuments();
    if (count >= 3) {
      return res.redirect("/adminportal/resourcesmanagement?error=max");
    }

    const { overlayText, buttonText, buttonUrl, imageOption, imageUrl } = req.body;

    let finalImageUrl = imageUrl;

    // uploaded file
    if (imageOption === "upload" && req.file) {
      finalImageUrl = `/images/uploads/${req.file.filename}`;
    }

    // fallback if nothing provided
    if (!finalImageUrl) finalImageUrl = "/images/default-fallback.jpg";

    await new ResourcesImage({
      imageUrl: finalImageUrl,
      overlayText,
      buttonText,
      buttonUrl
    }).save();

    res.redirect("/adminportal/resourcesmanagement");
  } catch (err) {
    console.error("Error creating Resources image:", err);
    res.status(500).send("Error creating Resources image");
  }
};

// EDIT VIEW
exports.editResourcesImage = async (req, res) => {
  try {
    const resource = await ResourcesImage.findById(req.params.id);
    if (!resource) return res.status(404).send("Resource not found");

    res.render("editresourcesimage", {
      csrfToken: req.csrfToken(),
      resource,
      layout: false
    });
  } catch (err) {
    console.error("Error loading edit page:", err);
    res.status(500).send("Error loading edit page");
  }
};

// UPDATE
exports.updateResourcesImage = async (req, res) => {
  try {
    const resource = await ResourcesImage.findById(req.params.id);
    if (!resource) return res.status(404).send("Resource not found");

    const { overlayText, buttonText, buttonUrl, imageOption, imageUrl } = req.body;

    // update non-image fields
    resource.overlayText = overlayText;
    resource.buttonText = buttonText;
    resource.buttonUrl = buttonUrl;

    // update image based on admin choice
    if (imageOption === "upload" && req.file) {
      // delete old image file if needed
      if (resource.imageUrl?.startsWith("/images/uploads/")) {
        const oldImg = path.join(__dirname, "..", "public", resource.imageUrl.replace(/^\//, ""));
        fs.unlink(oldImg, err => {
          if (err) console.warn("Could not delete old resource image:", err);
        });
      }
      resource.imageUrl = `/images/uploads/${req.file.filename}`;
    } else if (imageOption === "url" && imageUrl) {
      resource.imageUrl = imageUrl;
    }

    await resource.save();
    res.redirect("/adminportal/resourcesmanagement");
  } catch (err) {
    console.error("Error updating Resources image:", err);
    res.status(500).send("Error updating Resources image");
  }
};

// DELETE
exports.deleteResourcesImage = async (req, res) => {
  try {
    const resource = await ResourcesImage.findById(req.params.id);
    if (!resource) return res.status(404).send("Resource not found");

    // delete local file if it was uploaded
    if (resource.imageUrl?.startsWith("/images/uploads/")) {
      const imgPath = path.join(__dirname, "..", "public", resource.imageUrl.replace(/^\//, ""));
      fs.unlink(imgPath, err => {
        if (err) console.warn("Could not delete resource image:", err);
      });
    }

    await ResourcesImage.findByIdAndDelete(req.params.id);
    res.redirect("/adminportal/resourcesmanagement");
  } catch (err) {
    console.error("Error deleting Resources image:", err);
    res.status(500).send("Error deleting Resources image");
  }
};
