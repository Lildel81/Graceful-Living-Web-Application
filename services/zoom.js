// services/zoom.js
const axios = require("axios");
const qs = require("querystring");
const ZoomAuth = require("../models/ZoomAuth");

// Helper: HTTP Basic for token refresh
function basicAuthHeader(clientId, clientSecret) {
  const b64 = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  return `Basic ${b64}`;
}

// Load Zoom access token; refresh if expiring/expired.
// ownerKey: maps to your ZoomAuth.ownerKey (default 'default-admin')
async function ensureAccessToken(ownerKey = "default-admin") {
  // pull the most recent auth record for this ownerKey
  const auth = await ZoomAuth.findOne({ ownerKey }).sort({ updatedAt: -1 });
  if (!auth || !auth.refresh_token) {
    throw new Error("Zoom not connected for this owner");
  }

  const now = Date.now();
  const almostExpired = !auth.expires_at || now >= auth.expires_at - 60 * 1000;
  if (!almostExpired && auth.access_token) {
    return auth.access_token;
  }

  // refresh token
  const tokenUrl = "https://zoom.us/oauth/token";
  const body = qs.stringify({
    grant_type: "refresh_token",
    refresh_token: auth.refresh_token,
  });

  const resp = await axios.post(tokenUrl, body, {
    headers: {
      Authorization: basicAuthHeader(
        process.env.ZOOM_CLIENT_ID,
        process.env.ZOOM_CLIENT_SECRET
      ),
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const { access_token, refresh_token, expires_in } = resp.data;

  auth.access_token = access_token;
  if (refresh_token) auth.refresh_token = refresh_token; // Zoom may rotate it
  if (expires_in) auth.expires_at = Date.now() + expires_in * 1000;
  await auth.save();

  return access_token;
}

// Create a scheduled Zoom meeting
// startISO should be an ISO date (we’ll toISOString it defensively)
async function createMeeting({
  ownerKey = "default-admin",
  topic,
  startISO,
  durationMinutes = 30,
  timezone = "UTC",
}) {
  const accessToken = await ensureAccessToken(ownerKey);

  const payload = {
    topic: topic || "Meeting",
    type: 2, // scheduled
    start_time: new Date(startISO).toISOString(), // Zoom expects ISO 8601 in UTC
    duration: Number(durationMinutes) || 30,
    timezone, // Zoom uses this for display; start_time is UTC ISO
    settings: {
      join_before_host: false,
      waiting_room: true,
      mute_upon_entry: true,
      approval_type: 2, // 2 = no registration
    },
  };

  const resp = await axios.post(
    "https://api.zoom.us/v2/users/me/meetings",
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  return {
    id: resp.data.id,
    join_url: resp.data.join_url,
    start_url: resp.data.start_url,
    raw: resp.data,
  };
}

// services/zoom.js
const axios = require("axios");
const ZoomAuth = require("../models/ZoomAuth");

// helper to ensure a fresh access token (you already have something similar)
async function getAccessToken(ownerKey = "default-admin") {
  const row = await ZoomAuth.findOne({ ownerKey });
  if (!row) throw new Error("No Zoom auth found");
  // TODO: refresh if expired (your existing refresh logic)
  return row.access_token;
}

/**
 * Update an existing Zoom meeting's start time / duration / timezone
 * @param {Object} opts
 * @param {String} opts.ownerKey
 * @param {String|Number} opts.meeting_id
 * @param {Date}   opts.startISO   JS Date (UTC or local)
 * @param {Number} opts.durationMinutes
 * @param {String} opts.timezone   e.g. "America/Los_Angeles"
 */
async function updateMeeting({
  ownerKey,
  meeting_id,
  startISO,
  durationMinutes,
  timezone,
}) {
  const accessToken = await getAccessToken(ownerKey);
  const isoForZoom = new Date(startISO).toISOString(); // Zoom expects RFC3339

  const payload = {
    start_time: isoForZoom,
    duration: durationMinutes,
    timezone,
  };

  await axios.patch(`https://api.zoom.us/v2/meetings/${meeting_id}`, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  return { ok: true };
}

module.exports = {
  // ...createMeeting,
  updateMeeting,
};
module.exports = { ensureAccessToken, createMeeting };
