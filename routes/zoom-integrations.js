const express = require("express");
const axios = require("axios");
const qs = require("querystring");
const ZoomAuth = require("../models/ZoomAuth");

const router = express.Router();

// ----- Helpers -----
async function getZoomAuth(ownerKey = "default-admin") {
  let doc = await ZoomAuth.findOne({ ownerKey });
  if (!doc) doc = await ZoomAuth.create({ ownerKey });
  return doc;
}

router.get("/admin-appointment-portal", async (req, res) => {
  const doc = await ZoomAuth.findOne({ ownerKey: "default-admin" });
  const zoomConnected = !!(doc && doc.access_token);
  res.render("admin-appointment-portal", {
    zoomConnected,
    zoomEmail: doc?.zoom_email,
  });
});

async function ensureAccessToken(ownerKey = "default-admin") {
  const doc = await getZoomAuth(ownerKey);
  if (!doc.refresh_token) throw new Error("Zoom not connected");

  const isExpired = !doc.expires_at || Date.now() >= doc.expires_at;
  if (!isExpired) return { token: doc.access_token, doc };

  // refresh
  const res = await axios.post(
    "https://zoom.us/oauth/token",
    qs.stringify({
      grant_type: "refresh_token",
      refresh_token: doc.refresh_token,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
          ).toString("base64"),
      },
    }
  );

  doc.access_token = res.data.access_token;
  doc.refresh_token = res.data.refresh_token || doc.refresh_token;
  doc.expires_at = Date.now() + (res.data.expires_in - 60) * 1000; // 60s buffer
  doc.scope = res.data.scope;
  await doc.save();

  return { token: doc.access_token, doc };
}

// ----- Routes -----

// 1) Start OAuth: redirect to Zoom
router.get("/integrations/zoom/connect", async (req, res) => {
  const authURL = new URL("https://zoom.us/oauth/authorize");
  authURL.searchParams.set("response_type", "code");
  authURL.searchParams.set("client_id", process.env.ZOOM_CLIENT_ID);
  authURL.searchParams.set("redirect_uri", process.env.ZOOM_REDIRECT_URI);
  console.log("[zoom] connect URL:", authURL.toString());
  res.redirect(authURL.toString());
});

// 2) OAuth callback: exchange code for tokens + fetch /users/me
router.get("/integrations/zoom/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing ?code");

  try {
    // exchange
    const tokenRes = await axios.post(
      "https://zoom.us/oauth/token",
      qs.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.ZOOM_REDIRECT_URI,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(
              `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
            ).toString("base64"),
        },
      }
    );

    // store
    const doc = await getZoomAuth("default-admin");
    doc.access_token = tokenRes.data.access_token;
    doc.refresh_token = tokenRes.data.refresh_token;
    doc.expires_at = Date.now() + (tokenRes.data.expires_in - 60) * 1000;
    doc.scope = tokenRes.data.scope;

    // get user info
    const me = await axios.get("https://api.zoom.us/v2/users/me", {
      headers: { Authorization: `Bearer ${doc.access_token}` },
    });

    doc.zoom_user_id = me.data.id;
    doc.zoom_email = me.data.email;
    await doc.save();

    // Back to admin portal, integrations view
    res.redirect("/admin-appointment-portal?view=integrations");
  } catch (e) {
    console.error("Zoom callback error:", e?.response?.data || e.message);
    res.status(500).send("Zoom connection failed");
  }
});

// 3) Status – used by tile to reflect connected state
router.get("/integrations/zoom/status", async (req, res) => {
  try {
    const doc = await ZoomAuth.findOne({ ownerKey: "default-admin" });
    if (!doc?.access_token) return res.json({ connected: false });
    res.json({
      connected: true,
      email: doc.zoom_email,
      zoom_user_id: doc.zoom_user_id,
      scope: doc.scope,
      expires_at: doc.expires_at,
    });
  } catch (e) {
    res.json({ connected: false });
  }
});

// 4) Disconnect – clear tokens
router.get("/integrations/zoom/disconnect", async (req, res) => {
  await ZoomAuth.findOneAndUpdate(
    { ownerKey: "default-admin" },
    {
      access_token: null,
      refresh_token: null,
      expires_at: null,
      zoom_user_id: null,
      zoom_email: null,
      scope: null,
    }
  );
  res.redirect("/admin-appointment-portal?view=integrations");
});

// 5) Create a meeting – call from booking flow
router.post("/integrations/zoom/create-meeting", async (req, res) => {
  try {
    const { token } = await ensureAccessToken("default-admin");

    // Expect these in body; provide defaults
    const {
      topic = "GracefuLiving Session",
      start_time, // ISO 8601 like "2025-10-13T17:00:00Z"
      duration = 30,
    } = req.body || {};

    const createRes = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        topic,
        type: 2, // scheduled
        start_time,
        duration,
        settings: {
          join_before_host: true,
          waiting_room: false,
        },
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    res.json({
      id: createRes.data.id,
      join_url: createRes.data.join_url,
      start_url: createRes.data.start_url,
      start_time: createRes.data.start_time,
    });
  } catch (e) {
    console.error("create-meeting error:", e?.response?.data || e.message);
    res.status(500).json({ error: "Failed to create Zoom meeting" });
  }
});

module.exports = router;
