// services/mailer.js
// Gmail OAuth2 mailer for GracefulLiving
// Uses OAuth2 refresh token to obtain a fresh access token per send.

const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const {
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REFRESH_TOKEN,
  GMAIL_USER,
  MAIL_FROM,
} = process.env;

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });

console.log("[mailer env]", {
  user: process.env.GMAIL_USER,
  hasClient: !!process.env.GMAIL_CLIENT_ID,
  hasSecret: !!process.env.GMAIL_CLIENT_SECRET,
  hasRefresh: !!process.env.GMAIL_REFRESH_TOKEN,
});

// Helper to build a transporter with a fresh access token
async function buildTransporter() {
  const accessTokenResponse = await oauth2Client.getAccessToken();
  if (!accessTokenResponse || !accessTokenResponse.token) {
    throw new Error("Unable to obtain Gmail OAuth2 access token");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: GMAIL_USER,
      clientId: GMAIL_CLIENT_ID,
      clientSecret: GMAIL_CLIENT_SECRET,
      refreshToken: GMAIL_REFRESH_TOKEN,
      accessToken: accessTokenResponse.token,
    },
    logger: true, // set to false in prod if too noisy
    debug: true, // set to false in prod if too noisy
  });
}

// Verify once at startup (non-fatal if it fails)
(async () => {
  try {
    const transporter = await buildTransporter();
    await transporter.verify();
    console.log("[quizMailer] Gmail OAuth2 ready");
  } catch (err) {
    console.error("[quizMailer] Gmail OAuth2 verify failed:", err.message);
  }
})();

// Main send function (same signature as before)
async function sendMail({ to, subject, text, html }) {
  try {
    const transporter = await buildTransporter();
    const info = await transporter.sendMail({
      from: MAIL_FROM || `"GracefulLiving" <${GMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log("[quizMailer] sent", { to, messageId: info.messageId });
    return info;
  } catch (err) {
    console.error("[quizMailer] send failed:", err.message);
    throw err;
  }
}

module.exports = { sendMail };
