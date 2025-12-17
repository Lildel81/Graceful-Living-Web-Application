const express = require("express");
const router = express.Router();

// multer upload middleware
const { upload } = require('../middleware/upload')

// controller
const aboutUsController = require("../controllers/aboutUsController");

// csrf protection
const csrf = require("csurf");
const csrfProtection = csrf({
  cookie: {
    key: "_csrf",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
});

// GET ABOUT US
router.get(
  "/adminportal/aboutusmanagement",
  csrfProtection,
  aboutUsController.getAboutUsManagement
);

// ABOUT US INTRO

// CREATE intro
router.post(
  "/adminportal/aboutusintro/create",
  upload.single("headshot"), // file input from form
  csrfProtection,
  aboutUsController.createIntro
);

// EDIT intro page 
router.get(
  "/adminportal/aboutusintro/:id/edit",
  csrfProtection,
  aboutUsController.editIntro
);

// UPDATE intro
router.post(
  "/adminportal/aboutusintro/:id/update",
  upload.single("headshot"),
  csrfProtection,
  aboutUsController.updateIntro
);

// DELETE intro
router.post(
  "/adminportal/aboutusintro/:id/delete",
  csrfProtection,
  aboutUsController.deleteIntro
);

// ABOUT US CONTENT

// CREATE content block
router.post(
  "/adminportal/aboutuscontent/create",
  upload.single("image"), 
  csrfProtection,
  aboutUsController.createContent
);

// EDIT content page
router.get(
  "/adminportal/aboutuscontent/:id/edit",
  csrfProtection,
  aboutUsController.editContent
);

// UPDATE content block
router.post(
  "/adminportal/aboutuscontent/:id/update",
  upload.single("image"),
  csrfProtection,
  aboutUsController.updateContent
);

// DELETE content block
router.post(
  "/adminportal/aboutuscontent/:id/delete",
  csrfProtection,
  aboutUsController.deleteContent
);

module.exports = router;
