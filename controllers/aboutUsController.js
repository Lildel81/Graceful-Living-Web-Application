// reference schemas
const AboutUsIntro = require("../models/aboutUsIntroSchema");
const AboutUsContent = require("../models/aboutUsContentSchema");

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

// get full about us management page
exports.getAboutUsManagement = async (req, res) => {
  try {
    const intro = await AboutUsIntro.find().sort({ createdAt: -1 });
    const content = await AboutUsContent.find().sort({ createdAt: -1 });

    res.render("aboutusmanagement", {
      csrfToken: req.csrfToken(),
      intro,
      content,
      layout: false
    });
  } catch (err) {
    console.error("Error loading About Us management page:", err);
    res.status(500).send("Error loading About Us management page");
  }
};

// ABOUT US INTRO

// create
exports.createIntro = async (req, res) => {
  try {
    const { title, description } = req.body;

    let headshotUrl = null;

    if (req.file) {
      const filename = safeFilename(req.file.originalname);
      const key = `about/headshots/${filename}`;

      await putToS3({
        key,
        buffer: req.file.buffer,
        contentType: req.file.mimetype
      });

      headshotUrl = publicS3Url(key);
    }

    await new AboutUsIntro({
      title,
      description,
      headshotUrl
    }).save();

    res.redirect("/adminportal/aboutusmanagement");
  } catch (err) {
    console.error("Error creating intro:", err);
    res.status(500).send("Error creating intro");
  }
};

// edit
exports.editIntro = async (req, res) => {
  try {
    const intro = await AboutUsIntro.findById(req.params.id);
    if (!intro) return res.status(404).send("Intro not found");

    res.render("editaboutusintro", {
      csrfToken: req.csrfToken(),
      intro,
      layout: false
    });
  } catch (err) {
    console.error("Error loading intro edit page:", err);
    res.status(500).send("Error loading edit page");
  }
};

// update
exports.updateIntro = async (req, res) => {
  try {
    const intro = await AboutUsIntro.findById(req.params.id);
    if (!intro) return res.status(404).send("Intro not found");

    const { title, description } = req.body;

    // replace headshot if new one uploaded
    if (req.file) {
      // delete old from S3 (only if it’s one of ours)
      if (intro.headshotUrl && isOurS3Url(intro.headshotUrl)) {
        const oldKey = keyFromPublicS3Url(intro.headshotUrl);
        if (oldKey) {
          try { await deleteFromS3(oldKey); }
          catch (err) { console.warn("Could not delete old headshot from S3:", oldKey, err.message); }
        }
      }

      // upload new
      const filename = safeFilename(req.file.originalname);
      const key = `about/headshots/${filename}`;

      await putToS3({
        key,
        buffer: req.file.buffer,
        contentType: req.file.mimetype
      });

      intro.headshotUrl = publicS3Url(key);
    }

    intro.title = title;
    intro.description = description;

    await intro.save();
    res.redirect("/adminportal/aboutusmanagement");
  } catch (err) {
    console.error("Error updating intro:", err);
    res.status(500).send("Error updating intro");
  }
};

// delete
exports.deleteIntro = async (req, res) => {
  try {
    const intro = await AboutUsIntro.findById(req.params.id);
    if (!intro) return res.status(404).send("Intro not found");

    // delete from S3 if present
    if (intro.headshotUrl && isOurS3Url(intro.headshotUrl)) {
      const key = keyFromPublicS3Url(intro.headshotUrl);
      if (key) {
        try { await deleteFromS3(key); }
        catch (err) { console.warn("Could not delete headshot from S3:", key, err.message); }
      }
    }

    await AboutUsIntro.findByIdAndDelete(req.params.id);
    res.redirect("/adminportal/aboutusmanagement");
  } catch (err) {
    console.error("Error deleting intro:", err);
    res.status(500).send("Error deleting intro");
  }
};

// ABOUT US CONTENT

// create
exports.createContent = async (req, res) => {
  try {
    const { title, description } = req.body;

    let imageUrl = null;

    if (req.file) {
      const filename = safeFilename(req.file.originalname);
      const key = `about/content/${filename}`;

      await putToS3({
        key,
        buffer: req.file.buffer,
        contentType: req.file.mimetype
      });

      imageUrl = publicS3Url(key);
    }

    await new AboutUsContent({
      title,
      description,
      imageUrl
    }).save();

    res.redirect("/adminportal/aboutusmanagement");
  } catch (err) {
    console.error("Error creating content:", err);
    res.status(500).send("Error creating content");
  }
};

// edit
exports.editContent = async (req, res) => {
  try {
    const content = await AboutUsContent.findById(req.params.id);
    if (!content) return res.status(404).send("Content not found");

    res.render("editaboutuscontent", {
      csrfToken: req.csrfToken(),
      content,
      layout: false
    });
  } catch (err) {
    console.error("Error loading edit page:", err);
    res.status(500).send("Error loading edit page");
  }
};

// update
exports.updateContent = async (req, res) => {
  try {
    const content = await AboutUsContent.findById(req.params.id);
    if (!content) return res.status(404).send("Content not found");

    const { title, description } = req.body;

    // new image uploaded
    if (req.file) {
      // delete old from S3
      if (content.imageUrl && isOurS3Url(content.imageUrl)) {
        const oldKey = keyFromPublicS3Url(content.imageUrl);
        if (oldKey) {
          try { await deleteFromS3(oldKey); }
          catch (err) { console.warn("Could not delete old image from S3:", oldKey, err.message); }
        }
      }

      // upload new
      const filename = safeFilename(req.file.originalname);
      const key = `about/content/${filename}`;

      await putToS3({
        key,
        buffer: req.file.buffer,
        contentType: req.file.mimetype
      });

      content.imageUrl = publicS3Url(key);
    }

    content.title = title;
    content.description = description;

    await content.save();
    res.redirect("/adminportal/aboutusmanagement");
  } catch (err) {
    console.error("Error updating content:", err);
    res.status(500).send("Error updating content");
  }
};

// delete
exports.deleteContent = async (req, res) => {
  try {
    const content = await AboutUsContent.findById(req.params.id);
    if (!content) return res.status(404).send("Content not found");

    if (content.imageUrl && isOurS3Url(content.imageUrl)) {
      const key = keyFromPublicS3Url(content.imageUrl);
      if (key) {
        try { await deleteFromS3(key); }
        catch (err) { console.warn("Could not delete image from S3:", key, err.message); }
      }
    }

    await AboutUsContent.findByIdAndDelete(req.params.id);
    res.redirect("/adminportal/aboutusmanagement");
  } catch (err) {
    console.error("Error deleting content:", err);
    res.status(500).send("Error deleting content");
  }
};
