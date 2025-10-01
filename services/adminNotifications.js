// services/adminNotifications.js
const { sendMail } = require("./mailer");

// Escape HTML special chars
function esc(v = "") {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const adminList = () =>
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

function fmtVal(v) {
  if (v == null) return "";
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  return String(v);
}

function renderSectionRows(obj = {}) {
  return Object.entries(obj)
    .filter(([_, v]) => {
      if (v == null) return false;
      if (Array.isArray(v)) return v.length > 0;
      const s = String(v).trim();
      return s !== "";
    })
    .map(([k, v]) => {
      const val = esc(fmtVal(v));
      return `<tr>
        <td style="padding:6px 8px;border:1px solid #eee;"><b>${esc(k)}</b></td>
        <td style="padding:6px 8px;border:1px solid #eee;">${val}</td>
      </tr>`;
    })
    .join("");
}

function buildEmail(payload = {}) {
  const meta = payload.meta || {};
  const identity = payload.identity || {};
  const sections = payload.sections || {};

  const who = identity.fullName || identity.email || "Anonymous";
  const when = meta.completedAt
    ? new Date(meta.completedAt).toLocaleString("en-US", { hour12: true })
    : new Date().toLocaleString("en-US", { hour12: true });

  const idTable = `
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #eee;width:100%;max-width:760px;">
      <tr><td style="padding:8px;border:1px solid #eee;"><b>Name</b></td><td style="padding:8px;border:1px solid #eee;">${esc(
        identity.fullName || ""
      )}</td></tr>
      <tr><td style="padding:8px;border:1px solid #eee;"><b>Email</b></td><td style="padding:8px;border:1px solid #eee;">${esc(
        identity.email || ""
      )}</td></tr>
      <tr><td style="padding:8px;border:1px solid #eee;"><b>Phone</b></td><td style="padding:8px;border:1px solid #eee;">${esc(
        identity.contactNumber || ""
      )}</td></tr>
      <tr><td style="padding:8px;border:1px solid #eee;"><b>Goals</b></td><td style="padding:8px;border:1px solid #eee;">${esc(
        (identity.goals || "").toString()
      )}</td></tr>
    </table>
  `;

  const sectionHtml = (label, obj) => {
    const rows = renderSectionRows(obj);
    if (!rows) return "";
    return `
      <h3 style="margin:16px 0 8px;">${esc(label)}</h3>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #eee;width:100%;max-width:760px;">
        ${rows}
      </table>
    `;
  };

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
      <h2>Chakra Quiz Completed</h2>
      <p><b>User:</b> ${esc(who)}</p>
      <p><b>Quiz:</b> ${esc(
        meta.quizTitle || "Chakra Assessment"
      )} <span style="color:#777;">(${esc(
    meta.quizId || "chakra-assessment-v1"
  )})</span></p>
      <p><b>Completed At:</b> ${esc(when)}</p>

      ${idTable}

      ${sectionHtml("Root Chakra", sections.root)}
      ${sectionHtml("Sacral Chakra", sections.sacral)}
      ${sectionHtml("Solar Plexus Chakra", sections.solar)}
      ${sectionHtml("Heart Chakra", sections.heart)}
      ${sectionHtml("Throat Chakra", sections.throat)}
      ${sectionHtml("Third Eye Chakra", sections.thirdEye)}
      ${sectionHtml("Crown Chakra", sections.crown)}
      ${sectionHtml("Health & Wellness", sections.healthWellness)}
      ${sectionHtml("Love & Relationships", sections.loveRelationships)}
      ${sectionHtml("Career / Job", sections.careerJob)}
      ${sectionHtml("Time & Money Freedom", sections.timeMoney)}
    </div>
  `;

  const text = [
    "Chakra Quiz Completed",
    `User: ${who}`,
    `Quiz: ${meta.quizTitle || "Chakra Assessment"} (${
      meta.quizId || "chakra-assessment-v1"
    })`,
    `Completed At: ${when}`,
  ].join("\n");

  return {
    to: adminList(),
    subject: `Chakra Quiz Completed — ${who}`,
    text,
    html,
    replyTo: identity.email || undefined, // 👈 let admins reply to user
  };
}

async function notifyAdmins(payload) {
  const { to, subject, text, html, replyTo } = buildEmail(payload);
  console.log("[notifyAdmins] ADMIN_EMAILS ->", to);
  if (!to.length) {
    console.warn("[notifyAdmins] no ADMIN_EMAILS set");
    return;
  }
  try {
    const info = await sendMail({ to, subject, text, html, replyTo });
    console.info("[notifyAdmins] sent", { to, messageId: info?.messageId });
  } catch (err) {
    console.error("[notifyAdmins] sendMail failed", err);
  }
}

module.exports = { notifyAdmins };
