const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // tells Nodemailer to use Gmail servers automatically
  auth: {
    type: "OAuth2", // enables OAuth2 flow instead of plain password auth
    user: process.env.GMAIL_USER, // your Gmail address
    clientId: process.env.GMAIL_CLIENT_ID, // OAuth2 Client ID from Google Cloud Console
    clientSecret: process.env.GMAIL_CLIENT_SECRET, // OAuth2 Client Secret
    refreshToken: process.env.GMAIL_REFRESH_TOKEN, // refresh token for new access tokens
  },
  logger: true, // prints detailed logs for debugging
  debug: true, // enables low-level SMTP logs
});

// verify once at startup
transporter
  .verify()
  .then(() => console.log("[quizMailer] SMTP ready"))
  .catch((err) => console.error("[quizMailer] SMTP error:", err));

async function sendMail({ to, subject, text, html }) {
  const info = await transporter.sendMail({
    from:
      process.env.MAIL_FROM || '"GracefulLiving" <no-reply@gracefulliving.app>',
    to,
    subject,
    text,
    html,
  });
  console.log("[quizMailer] sent", { to, messageId: info.messageId });
  return info;
}

module.exports = { sendMail };
