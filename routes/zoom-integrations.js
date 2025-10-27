const express = require("express");
const axios = require("axios");
const router = express.Router();

const {
  ZOOM_OAUTH_CLIENT_ID,
  ZOOM_OAUTH_CLIENT_SECRET,
  ZOOM_OAUTH_REDIRECT_URI,
} = process.env;

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.isAdmin) {
    return res.status(403).send("Forbidden");
  }
  next();
}

// STEP 1: Admin clicks "Connect" -> redirect them to Zoom's OAuth authorize screen
router.get("/zoom/connect", requireAdmin, (req, res) => {
  const authorizeUrl = new URL("https://zoom.us/oauth/authorize");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", ZOOM_OAUTH_CLIENT_ID);
  authorizeUrl.searchParams.set("redirect_uri", ZOOM_OAUTH_REDIRECT_URI);

  // optional: state param to prevent CSRF/for deep linking
  // We could stash req.session.csrfZoomState but skipping for now.

  res.redirect(authorizeUrl.toString());
});

// STEP 2: Zoom redirects back here with ?code=...
router.get("/zoom/callback", requireAdmin, async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Missing code from Zoom");
  }

  try {
    // Exchange code for access_token + refresh_token
    // per Zoom OAuth docs: POST https://zoom.us/oauth/token
    const tokenResp = await axios.post("https://zoom.us/oauth/token", null, {
      params: {
        grant_type: "authorization_code",
        code,
        redirect_uri: ZOOM_OAUTH_REDIRECT_URI,
      },
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            `${ZOOM_OAUTH_CLIENT_ID}:${ZOOM_OAUTH_CLIENT_SECRET}`
          ).toString("base64"),
      },
    });

    const { access_token, refresh_token, expires_in, scope, token_type } =
      tokenResp.data;

    // OPTIONAL: fetch the Zoom user to know who connected (email, id)
    // GET https://api.zoom.us/v2/users/me with that access_token
    const meResp = await axios.get("https://api.zoom.us/v2/users/me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const zoomUser = meResp.data;
    // zoomUser.email, zoomUser.id, zoomUser.first_name, etc.

    // Save info in session for now (can be moved to mongo later)
    req.session.zoomConnected = true;
    req.session.zoomEmail = zoomUser.email;
    req.session.zoomAccessToken = access_token;
    req.session.zoomRefreshToken = refresh_token;
    req.session.zoomTokenExpiresAt = Date.now() + expires_in * 1000;
    req.session.zoomUserId = zoomUser.id;

    // Send back to dashboard
    res.redirect("/adminportal/appointments");
  } catch (err) {
    console.error("Zoom OAuth callback error:", err.response?.data || err);
    res.status(500).send("Failed to connect Zoom");
  }
});

// STEP 3: Disconnect -> just clear session tokens
router.post("/zoom/disconnect", requireAdmin, (req, res) => {
  req.session.zoomConnected = false;
  req.session.zoomEmail = null;
  req.session.zoomAccessToken = null;
  req.session.zoomRefreshToken = null;
  req.session.zoomTokenExpiresAt = null;
  req.session.zoomUserId = null;

  res.redirect("/adminportal/appointments");
});

module.exports = router;
