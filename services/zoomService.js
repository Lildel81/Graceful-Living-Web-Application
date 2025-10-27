const axios = require("axios");

// helper to actually create meeting with a given token + userId/email
async function createZoomMeetingWithToken({
  accessToken,
  hostUserId,
  topic,
  startTime,
  durationMin,
}) {
  const payload = {
    topic,
    type: 2,
    start_time: startTime.toISOString(),
    duration: durationMin,
    timezone: "America/Los_Angeles",
    settings: {
      join_before_host: false,
      waiting_room: true,
      mute_upon_entry: true,
    },
  };

  const res = await axios.post(
    `https://api.zoom.us/v2/users/${encodeURIComponent(hostUserId)}/meetings`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  return {
    meetingId: res.data.id,
    joinUrl: res.data.join_url,
    startUrl: res.data.start_url,
  };
}

module.exports = {
  createZoomMeetingWithToken,
};
