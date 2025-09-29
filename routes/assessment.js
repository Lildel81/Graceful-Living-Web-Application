const express = require("express");
const router = express.Router();
const { saveAssessment } = require("../controllers/assessmentController");

router.post(
  "/assessment/save",
  express.urlencoded({ extended: true }),
  saveAssessment
);
router.get("/assessment/thanks", (req, res) => res.render("quiz/thanks"));

module.exports = router;
