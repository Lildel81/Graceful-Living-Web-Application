// reference schemas
const ResourcesImage = require("../models/resourcesImage");
const ResourcesText = require("../models/resourcesText");

const { putToS3, deleteFromS3 } = require("../public/js/s3");  
const { safeFilename } = require("../middleware/upload");  

function publicS3Url(key) {
  return `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

function keyFromPublicS3Url(url) {
  // expects: https://<bucket>.s3.<region>.amazonaws.com/<key>
  try {
    const u = new URL(url);
    return u.pathname.replace(/^\//, "");
  } catch {
    return null;
  }
}

function isOurS3Url(url) {
  return typeof url === "string" && url.includes(".amazonaws.com/");
}

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

    // uploaded file -> S3
    if (imageOption === "upload" && req.file) {
      const filename = safeFilename(req.file.originalname);
      const key = `resources/${filename}`;

      await putToS3({
        key,
        buffer: req.file.buffer,
        contentType: req.file.mimetype
      });

      finalImageUrl = publicS3Url(key);
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
      // delete old S3 object if it was ours
      if (isOurS3Url(resource.imageUrl)) {
        const oldKey = keyFromPublicS3Url(resource.imageUrl);
        if (oldKey) {
          try { await deleteFromS3(oldKey); }
          catch (err) { console.warn("Could not delete old resource image from S3:", oldKey, err.message); }
        }
      }

      // upload new
      const filename = safeFilename(req.file.originalname);
      const key = `resources/${filename}`;

      await putToS3({
        key,
        buffer: req.file.buffer,
        contentType: req.file.mimetype
      });

      resource.imageUrl = publicS3Url(key);

    } else if (imageOption === "url" && imageUrl) {
      // switching to external URL -> delete old S3 object if needed
      if (isOurS3Url(resource.imageUrl)) {
        const oldKey = keyFromPublicS3Url(resource.imageUrl);
        if (oldKey) {
          try { await deleteFromS3(oldKey); }
          catch (err) { console.warn("Could not delete old resource image from S3:", oldKey, err.message); }
        }
      }
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

    // delete S3 object if it was ours
    if (isOurS3Url(resource.imageUrl)) {
      const key = keyFromPublicS3Url(resource.imageUrl);
      if (key) {
        try { await deleteFromS3(key); }
        catch (err) { console.warn("Could not delete resource image from S3:", key, err.message); }
      }
    }

    await ResourcesImage.findByIdAndDelete(req.params.id);
    res.redirect("/adminportal/resourcesmanagement");
  } catch (err) {
    console.error("Error deleting Resources image:", err);
    res.status(500).send("Error deleting Resources image");
  }
};
