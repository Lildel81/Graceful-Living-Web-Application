const { sendResetEmail } = require("../mail/mailer");

async function notifyAdminQuizComplete(userEmail) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.error("[notifyAdminQuizComplete] ADMIN_EMAIL not set");
    return;
  }

  const subject = "New Chakra Quiz Completed";
  const html = `
    <h2>A user just completed the Chakra Quiz!</h2>
    <p><b>User:</b> ${userEmail}</p>
    <p>Go to the admin dashboard for details.</p>
  `;

  try {
    await sendResetEmail({
      to: adminEmail,
      subject,
      html,
      text: `User ${userEmail} has completed the Chakra Quiz.`,
    });
    console.info("[notifyAdminQuizComplete] Email sent to", adminEmail);
  } catch (err) {
    console.error("[notifyAdminQuizComplete] Failed to send email:", err);
  }
}

module.exports = { notifyAdminQuizComplete };
