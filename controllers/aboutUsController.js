// reference schemas
const AboutUsIntro = require("../models/aboutUsIntroSchema");
const AboutUsContent = require("../models/aboutUsContentSchema");

const fs = require("fs");
const path = require("path");

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

    const headshotUrl = req.file
      ? `/var/data/${req.file.filename}`
      : null;

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
      if (intro.headshotUrl) {
        const oldImg = path.join(__dirname, "..", "public", intro.headshotUrl.replace(/^\//, ""));
        fs.unlink(oldImg, (err) => {
          if (err) console.warn("Could not delete old headshot:", err);
        });
      }
      intro.headshotUrl = `/var/data/${req.file.filename}`;
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

    // delete image file
    if (intro.headshotUrl) {
      const imgPath = path.join(__dirname, "..", "public", intro.headshotUrl.replace(/^\//, ""));
      fs.unlink(imgPath, (err) => {
        if (err) console.warn("Could not delete headshot:", err);
      });
    }

    await AboutUsIntro.findByIdAndDelete(req.params.id);

    res.redirect("/adminportal/aboutusmanagement");
  } catch (err) {
    console.error("Error deleting intro:", err);
    res.status(500).send("Error deleting intro");
  }
};


//  ABOUT US CONTENT

// create 
exports.createContent = async (req, res) => {
  try {
    const { title, description } = req.body;

    const imageUrl = req.file
      ? `/var/data/${req.file.filename}`
      : null;

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
      if (content.imageUrl) {
        const oldPath = path.join(__dirname, "..", "public", content.imageUrl.replace(/^\//, ""));
        fs.unlink(oldPath, (err) => {
          if (err) console.warn("Could not delete old image:", err);
        });
      }
      content.imageUrl = `/var/data/${req.file.filename}`;
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

    if (content.imageUrl) {
      // const imgPath = path.join(__dirname, "..", content.imageUrl);
      const imgPath = path.join(__dirname, "..", "public", content.imageUrl.replace(/^\//, ""));
      fs.unlink(imgPath, (err) => {
        if (err) console.warn("Could not delete image:", err);
      });
    }

    await AboutUsContent.findByIdAndDelete(req.params.id);
    res.redirect("/adminportal/aboutusmanagement");
  } catch (err) {
    console.error("Error deleting content:", err);
    res.status(500).send("Error deleting content");
  }
};