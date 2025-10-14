const express = require("express");
const router = express.Router();

const { sendMail } = require("../services/mailer");
const Appointment = require("../models/Appointment");

// NOTE: if you added services/zoom.js, it will be required conditionally below.

router.post("/appointments", async (req, res) => {
  try {
    const {
      title = "GracefuLiving Session",
      clientName = "Client",
      clientEmail,
      date, // "YYYY-MM-DD"
      time, // "HH:mm"
      duration = 30,
      location_type = "zoom",
      notes = "",
    } = req.body || {};

    if (!clientEmail || !date || !time) {
      return res
        .status(400)
        .json({ ok: false, error: "Missing required fields" });
    }

    const durationNum = Number(duration) || 30;

    // Compose a Date from local date+time
    const startISO = new Date(`${date}T${time}:00`);
    const endISO = new Date(startISO.getTime() + durationNum * 60 * 1000);

    const startPretty = startISO.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    // (Optional) Zoom links
    let join_url = null;
    let start_url = null;
    let meeting_id = null;

    // Create Zoom meeting if requested
    if (location_type === "zoom") {
      try {
        const { createMeeting } = require("../services/zoom"); // only if you added it
        const ownerKey = "default-admin";
        const meeting = await createMeeting({
          ownerKey,
          topic: title,
          startISO,
          durationMinutes: durationNum,
          timezone: "America/Los_Angeles",
        });
        join_url = meeting.join_url;
        start_url = meeting.start_url;
        meeting_id = String(meeting.id || "");
        console.log("[Zoom] Meeting created:", join_url);
      } catch (zErr) {
        console.error(
          "Zoom createMeeting failed:",
          zErr?.response?.data || zErr
        );
      }
    }

    // Save to MongoDB
    const apptDoc = await Appointment.create({
      ownerKey: "default-admin",
      title,
      clientName,
      clientEmail,
      start: startISO,
      end: endISO,
      duration: durationNum,
      timezone: "America/Los_Angeles",
      location_type,
      zoom: { join_url, start_url, meeting_id },
      notes,
    });

    // --------------------
    // Email: CLIENT
    // --------------------
    const clientSubject = `Appointment Confirmation: ${title}`;
    const clientHtml = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif">
        <p>Hi ${clientName || "there"},</p>
        <p>Your appointment is confirmed for <strong>${startPretty}</strong> (${durationNum} mins).</p>
        ${join_url ? `<p><a href="${join_url}">Join Zoom Meeting</a></p>` : ""}
        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
        <p>Thank you,<br/>GracefuLiving</p>
      </div>
    `;
    const clientText =
      `Hi ${clientName || "there"},\n\n` +
      `Your appointment is confirmed for ${startPretty} (${durationNum} mins).\n` +
      (join_url ? `Join Zoom: ${join_url}\n` : "") +
      (notes ? `Notes: ${notes}\n` : "") +
      `\nThank you,\nGracefuLiving`;

    await sendMail({
      to: clientEmail,
      subject: clientSubject,
      text: clientText,
      html: clientHtml,
    });

    // --------------------
    // Email: ADMIN (do not fail whole request if this throws)
    // --------------------
    let adminErr = null;
    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;
      const adminSubject = `New Appointment: ${title}`;
      const adminHtml = `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif">
          <p><strong>${title}</strong></p>
          <p><strong>Client:</strong> ${clientName} &lt;${clientEmail}&gt;</p>
          <p><strong>When:</strong> ${startPretty} (${durationNum} mins)</p>
          <p><strong>Type:</strong> ${location_type}</p>
          ${
            start_url
              ? `<p><a href="${start_url}">Start Zoom Meeting</a></p>`
              : ""
          }
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
        </div>
      `;
      const adminText =
        `New Appointment: ${title}\n` +
        `Client: ${clientName} <${clientEmail}>\n` +
        `When: ${startPretty} (${durationNum} mins)\n` +
        `Type: ${location_type}\n` +
        (start_url ? `Start Zoom: ${start_url}\n` : "") +
        (notes ? `Notes: ${notes}\n` : "");

      await sendMail({
        to: adminEmail,
        subject: adminSubject,
        text: adminText,
        html: adminHtml,
      });
    } catch (e) {
      adminErr = e;
      console.error("Admin email failed:", e);
    }

    return res.json({
      ok: true,
      message:
        "Appointment created " +
        (adminErr ? "(admin email failed)" : "and emails sent"),
      data: {
        id: apptDoc._id,
        join_url,
        start_url,
      },
    });
  } catch (err) {
    console.error("Error creating appointment:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to create appointment" });
  }
});

// Simple read API for upcoming appointments (for the Scheduling list)
router.get("/appointments", async (req, res) => {
  try {
    const now = new Date();
    const ownerKey = "default-admin";
    const items = await Appointment.find({
      ownerKey,
      start: { $gte: now },
    })
      .sort({ start: 1 })
      .limit(100)
      .lean();

    res.json({ ok: true, items });
  } catch (e) {
    console.error("List appointments error:", e);
    res.status(500).json({ ok: false, error: "Failed to list appointments" });
  }
});

router.put("/appointments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date, // "YYYY-MM-DD"  (required)
      time, // "HH:mm"       (required)
      duration, // minutes       (optional)
      timezone, // optional; default to previous or your app default
    } = req.body || {};

    if (!date || !time) {
      return res
        .status(400)
        .json({ ok: false, error: "date and time required" });
    }

    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ ok: false, error: "Not found" });

    const durationNum = Number(duration ?? appt.duration) || 30;
    const tz = timezone || appt.timezone || "America/Los_Angeles";

    const newStart = new Date(`${date}T${time}:00`);
    const newEnd = new Date(newStart.getTime() + durationNum * 60 * 1000);

    // If zoom meeting exists, update Zoom too
    const meetingId = appt?.zoom?.meeting_id;
    if (appt.location_type === "zoom" && meetingId) {
      try {
        const { updateMeeting } = require("../services/zoom");
        await updateMeeting({
          ownerKey: appt.ownerKey || "default-admin",
          meeting_id: meetingId,
          startISO: newStart,
          durationMinutes: durationNum,
          timezone: tz,
        });
      } catch (zErr) {
        console.error("Zoom update failed:", zErr?.response?.data || zErr);
        return res
          .status(502)
          .json({ ok: false, error: "Failed to update Zoom meeting" });
      }
    }

    appt.start = newStart;
    appt.end = newEnd;
    appt.duration = durationNum;
    appt.timezone = tz;
    await appt.save();

    return res.json({ ok: true, item: appt });
  } catch (err) {
    console.error("Reschedule error:", err);
    return res.status(500).json({ ok: false, error: "Failed to reschedule" });
  }
});

module.exports = router;
