const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// Prefer local venv python if it exists, otherwise fallback to global python3
const venvPython = path.join(__dirname, "../python/venv/bin/python");
const cmdToRun = fs.existsSync(venvPython) ? venvPython : "python3";

router.get("/adminportal/predict-chakra", async (req, res) => {
  const fs = require("fs");
  const path = require("path");
  const { spawn } = require("child_process");

  const venvPython = path.join(__dirname, "../python/venv/bin/python");
  const scriptPath = path.join(__dirname, "../python/predict_trend.py");

  const cmdToRun = fs.existsSync(venvPython) ? venvPython : "python3";

  if (!fs.existsSync(scriptPath)) {
    return res.render("chakra-forecast", {
      errorMessage: "Prediction script not found.",
      predicted: null,
      counts: null,
      layout: false
    });
  }

  try {
    const py = spawn(cmdToRun, [scriptPath]);
    let out = "", err = "";

    py.stdout.on("data", data => (out += data.toString()));
    py.stderr.on("data", data => (err += data.toString()));

    py.on("close", code => {
      if (code !== 0) {
        console.error("Python error:", err);
        return res.render("chakra-forecast", {
          errorMessage: "Prediction failed.",
          predicted: null,
          counts: null,
          layout: false
        });
      }
      try {
        const json = JSON.parse(out);
        res.render("chakra-forecast", {
          errorMessage: null,
          predicted: json.predicted_next_month,
          counts: json.forecast_counts,
          layout: false
        });
      } catch (e) {
        res.render("chakra-forecast", {
          errorMessage: "Invalid JSON from Python.",
          predicted: null,
          counts: null,
          layout: false
        });
      }
    });
  } catch (e) {
    console.error(e);
    res.render("chakra-forecast", {
      errorMessage: "Error launching prediction.",
      predicted: null,
      counts: null,
      layout: false
    });
  }
});


module.exports = router;
