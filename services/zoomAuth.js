// services/zoomAuth.js
const axios = require("axios");

async function getZoomAccessToken() {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  // Zoom requires Basic auth with base64(clientId:clientSecret)
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const url = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`;

  const res = await axios.post(url, null, {
    headers: {
      Authorization: `Basic ${basicAuth}`,
    },
  });

  return res.data.access_token;
}

module.exports = { getZoomAccessToken };
