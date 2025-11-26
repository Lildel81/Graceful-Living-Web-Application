const express = require("express");
const router = express.Router();
const axios = require("axios");

// point to your Flask service (env var OR default)
const ML_API_URL2 =
  process.env.ML_API_URL2 || "http://127.0.0.1:5000/api/predict_trend";
const ML_HEALTH_URL =
  process.env.ML_HEALTH_URL || "http://127.0.0.1:5000/health";

router.get("/adminportal/predict-chakra", async (req, res) => {
  try {
    // optional: quick health check so we can surface a nice error
    try {
      const health = await axios.get(ML_HEALTH_URL, { timeout: 2000 });
      if (health.data?.status !== "ok") {
        throw new Error("Flask ML API not ready");
      }
    } catch (e) {
      return res.render("chakra-forecast", {
        errorMessage: "ML service unavailable (health check failed).",
        predicted: null,
        counts: null,
        layout: false,
      });
    }

    // fetch forecast JSON from Flask
    const { data } = await axios.get(ML_API_URL2, {
      timeout: 10000,
      headers: { Accept: "application/json" },
    });

    return res.render("chakra-forecast", {
      errorMessage: null,
      predicted: data?.predicted_next_month || null,
      counts: data?.forecast_counts || null,
      layout: false,
    });
  } catch (err) {
    console.error("Error fetching ML forecast:", err.message);
    return res.render("chakra-forecast", {
      errorMessage: "Prediction failed.",
      predicted: null,
      counts: null,
      layout: false,
    });
  }
});

module.exports = router;
