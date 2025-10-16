const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // smtp.gmail.com
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // STARTTLS on 587
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  logger: true, // set to false in prod if too noisy
  debug: true, // set to false in prod if too noisy
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
