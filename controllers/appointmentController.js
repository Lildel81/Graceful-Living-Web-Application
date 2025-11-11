/**
 * APPOINTMENT CONTROLLER
 *
 * This file handles all business logic for the appointment booking system in the
 * GracefuLiving coaching platform. It manages appointments, admin availability,
 * blocked dates, and Google Calendar synchronization.
 *
 * Key Features:
 * - Available time slot generation for the next 60 days
 * - Appointment booking with validation and conflict checking
 * - Admin availability management (weekly schedule)
 * - Blocked date management (holidays, vacations)
 * - Google Calendar synchronization
 * - CRUD operations for appointments
 * - Timezone handling (Pacific Time)
 *
 * Controllers:
 * PUBLIC:
 * - getAvailableSlots: Provides available booking slots to clients
 * - createAppointment: Books new appointments
 *
 * ADMIN ONLY:
 * - getAllAppointments: Lists all appointments
 * - updateAppointmentStatus: Updates appointment status
 * - deleteAppointment: Cancels/deletes appointments
 * - getAdminAvailability: Retrieves weekly availability settings
 * - setAdminAvailability: Updates weekly availability
 * - addBlockedDate: Blocks specific dates
 * - removeBlockedDate: Unblocks specific dates
 * - getBlockedDates: Lists all blocked dates
 */

// Import required models and services
const Appointment = require("../models/appointment"); // Appointment data model
const {
  AdminAvailability,
  BlockedDate,
} = require("../models/adminAvailability"); // Availability models
const googleCalendarService = require("../services/googleCalendar"); // Google Calendar integration
const {
  createZoomMeeting,
  createZoomMeetingWithToken,
} = require("../services/zoomService");

// for sending out confirmation emails
const { sendMail } = require("../services/mailer");
const ejs = require("ejs");
const path = require("path");

const axios = require("axios");

// Global/per-session Zoom toggle helper
function isZoomEnabled(req) {
  // env hard kill switch
  if (process.env.ZOOM_ENABLED === "false") return false;
  // session-scoped toggle (set by /zoom/toggle route)
  if (req && req.session && typeof req.session.zoomEnabled !== "undefined") {
    return !!req.session.zoomEnabled;
  }
  // app-scoped toggle (optional, if you store it in app.locals)
  if (req && req.app && typeof req.app.locals.zoomEnabled !== "undefined") {
    return !!req.app.locals.zoomEnabled;
  }
  // default: ON
  return true;
}

// --- Zoom-style invite helpers ---------------------------------------------
function formatPacificDateTime(dateObj) {
  if (!dateObj) return "";
  // Example: Oct 27, 2025 03:00 PM Pacific Time (US and Canada)
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const m = months[dateObj.getMonth()];
  const d = dateObj.getDate();
  const y = dateObj.getFullYear();
  let hh = dateObj.getHours();
  const mm = String(dateObj.getMinutes()).padStart(2, "0");
  const ampm = hh >= 12 ? "PM" : "AM";
  hh = hh % 12;
  if (hh === 0) hh = 12;
  return `${m} ${d}, ${y} ${String(hh).padStart(
    2,
    "0"
  )}:${mm} ${ampm} Pacific Time (US and Canada)`;
}

function extractMeetingId(appointment) {
  if (appointment.zoomMeetingId)
    return String(appointment.zoomMeetingId).replace(/\s+/g, "");
  const url = appointment.zoomJoinUrl || "";
  // Try to grab the 11-digit id from typical join URLs
  const m = url.match(/\/j\/(\d{9,12})/);
  if (m) return m[1];
  return "";
}

function buildZoomInviteText(appointment) {
  const topic = appointment.serviceName || appointment.topic || "Session";
  const startAt = createDateTime(
    new Date(appointment.appointmentDate),
    appointment.appointmentTime
  );
  const timeLabel = formatPacificDateTime(startAt);
  const joinUrl = appointment.zoomJoinUrl || "";
  const meetingId = extractMeetingId(appointment);
  const meetingIdPretty = meetingId
    ? meetingId.replace(/(\d{3})(\d{4})(\d{4})/, "$1 $2 $3")
    : "";
  const oneTap1 = meetingId ? `+16699006833,,${meetingId}# US (San Jose)` : "";
  const oneTap2 = meetingId ? `+16694449171,,${meetingId}# US` : "";
  const sipLine = meetingId ? `${meetingId}@zoomcrc.com` : "";
  const joinInstr = appointment.zoomInviteUrl || ""; // optional

  return [
    `Topic: ${topic}`,
    `Time: ${timeLabel}`,
    `Join Zoom Meeting`,
    joinUrl,
    "",
    meetingIdPretty ? `Meeting ID: ${meetingIdPretty}` : "",
    "",
    "---",
    "",
    "One tap mobile",
    oneTap1,
    oneTap2,
    "",
    "---",
    "",
    "Join by SIP",
    sipLine ? `• ${sipLine}` : "",
    "",
    joinInstr ? "Join instructions" : "",
    joinInstr,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildZoomInviteHTML(appointment) {
  const text = buildZoomInviteText(appointment)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
  // Make links clickable
  return text
    .replace(/(https?:\/\/\S+)/g, '<a href="$1">$1</a>')
    .replace(/(\b[\w.-]+@zoomcrc\.com\b)/g, '<a href="sip:$1">$1</a>');
}

/**
 * GET AVAILABLE TIME SLOTS (PUBLIC)
 *
 * Generates all available appointment slots for the next 60 days based on:
 * - Admin's weekly availability settings
 * - Blocked dates (holidays, vacations)
 * - Existing appointments (to prevent double-booking)
 * - Current date/time (only future slots)
 *
 * Algorithm:
 * 1. Load admin availability settings (which days of week are available)
 * 2. Load blocked dates
 * 3. Load existing appointments
 * 4. For each of the next 60 days:
 *    - Check if day of week has availability
 *    - Check if date is not blocked
 *    - Generate 30-minute time slots
 *    - Exclude already booked slots
 *    - Exclude past time slots
 * 5. Return all available slots
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with available slots array
 */
const getAvailableSlots = async (req, res) => {
  try {
    // STEP 1: Load admin availability settings (which days of week are bookable)
    const availabilities = await AdminAvailability.find({ isActive: true });

    // If no availability is set, return empty slots
    if (availabilities.length === 0) {
      return res.json({ success: true, slots: [] });
    }

    // STEP 2: Load blocked dates (dates when admin is unavailable)
    const blockedDates = await BlockedDate.find({
      date: { $gte: new Date() }, // Only future blocked dates
    });

    // Convert blocked dates to ISO strings for easy comparison
    const blockedDateStrings = blockedDates.map(
      (bd) => bd.date.toISOString().split("T")[0]
    );

    // STEP 3: Load existing appointments to avoid double-booking
    const existingAppointments = await Appointment.find({
      appointmentDate: { $gte: new Date() }, // Only future appointments
      status: { $ne: "cancelled" }, // Exclude cancelled appointments
    });

    // STEP 4: Generate available slots for next 60 days
    const slots = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to midnight for accurate date comparison

    // Loop through each day for the next 60 days
    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dateStr = date.toISOString().split("T")[0]; // Format: YYYY-MM-DD
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

      // Skip if date is blocked by admin
      if (blockedDateStrings.includes(dateStr)) {
        continue;
      }

      // Find availability settings for this day of week
      const dayAvailability = availabilities.find(
        (av) => av.dayOfWeek === dayOfWeek
      );

      // Skip if admin doesn't work on this day of week
      if (!dayAvailability || dayAvailability.timeSlots.length === 0) {
        continue;
      }

      // Generate 30-minute slots from admin's available time ranges
      dayAvailability.timeSlots.forEach((timeSlot) => {
        // Break down time range into 30-minute slots
        const timeSlots = generateTimeSlots(timeSlot.start, timeSlot.end);

        timeSlots.forEach((slot) => {
          // Check if this time slot is already booked
          const isBooked = existingAppointments.some((apt) => {
            const aptDate = new Date(apt.appointmentDate)
              .toISOString()
              .split("T")[0];
            return aptDate === dateStr && apt.appointmentTime === slot;
          });

          // Only add future slots (not in the past)
          const slotDateTime = createDateTime(date, slot);
          const now = new Date();

          // Add slot if it's not booked and is in the future
          if (!isBooked && slotDateTime > now) {
            slots.push({
              date: dateStr, // YYYY-MM-DD format
              time: slot, // e.g., "2:00 PM - 2:30 PM"
              dateFormatted: formatDate(date), // e.g., "Monday, October 15, 2025"
            });
          }
        });
      });
    }

    // Return all available slots
    res.json({ success: true, slots });
  } catch (error) {
    console.error("Error getting available slots:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving available time slots",
    });
  }
};

/**
 * CREATE NEW APPOINTMENT (PUBLIC)
 *
 * Books a new appointment for a client. Performs validation, conflict checking,
 * saves to database, and syncs with Google Calendar.
 *
 * Process:
 * 1. Validate input data (name, email, phone, date, time)
 * 2. Check if time slot is still available (race condition protection)
 * 3. Check if appointment is in the future
 * 4. Save appointment to database
 * 5. Create Google Calendar event
 * 6. Link Google Calendar event ID to appointment
 *
 * @param {Object} req - Express request object with appointment data in req.body
 * @param {string} req.body.clientName - Client's full name
 * @param {string} req.body.clientEmail - Client's email address
 * @param {string} req.body.clientPhone - Client's phone number
 * @param {Date} req.body.appointmentDate - Appointment date
 * @param {string} req.body.appointmentTime - Time slot (e.g., "2:00 PM - 2:30 PM")
 * @param {string} req.body.notes - Optional appointment notes
 * @param {string} req.body._csrf - CSRF token (excluded from database)
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with created appointment
 */
const createAppointment = async (req, res) => {
  try {
    console.log("Received appointment request:", req.body); // Debug log

    // STEP 1: Validate appointment data using Joi schema
    const { error } = Appointment.validate(req.body);
    if (error) {
      console.log("Validation error:", error.details[0].message); // Debug log
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { appointmentDate, appointmentTime } = req.body;

    // STEP 2: Check if slot is still available (prevents double-booking)
    const dateStr = new Date(appointmentDate).toISOString().split("T")[0];
    const existingAppointment = await Appointment.findOne({
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: { $ne: "cancelled" }, // Ignore cancelled appointments
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: "This time slot is no longer available",
      });
    }

    // STEP 3: Verify the slot is in the future (prevent past bookings)
    const slotDateTime = createDateTime(
      new Date(appointmentDate),
      appointmentTime
    );
    const now = new Date();
    if (slotDateTime <= now) {
      return res.status(400).json({
        success: false,
        message: "Cannot book appointments in the past",
      });
    }

    // STEP 4: Create and save appointment to database
    // Exclude CSRF token from being saved to database
    const { _csrf, ...appointmentData } = req.body;
    const appointment = new Appointment(appointmentData);
    await appointment.save();

    // STEP 5: Create Zoom meeting for this appointment (honor toggle)
    const ZOOM_ENABLED = isZoomEnabled(req);
    let zoomInfo = null;
    try {
      if (
        ZOOM_ENABLED &&
        req.session.zoomConnected &&
        req.session.zoomAccessToken &&
        req.session.zoomUserId
      ) {
        zoomInfo = await createZoomMeetingWithToken({
          accessToken: req.session.zoomAccessToken,
          hostUserId: req.session.zoomUserId, // or req.session.zoomEmail
          topic: `Session with ${appointment.clientName}`,
          startTime: slotDateTime,
          durationMin: 30,
        });
      }
    } catch (zoomErr) {
      console.error(
        "Zoom meeting creation failed:",
        zoomErr.response?.data || zoomErr
      );
      // We do NOT block the booking if Zoom fails
    }

    if (zoomInfo) {
      appointment.zoomMeetingId = zoomInfo.meetingId;
      appointment.zoomJoinUrl = zoomInfo.joinUrl;
      appointment.zoomStartUrl = zoomInfo.startUrl;
      await appointment.save();
    }

    // STEP 6: Sync with Google Calendar (create event in admin's calendar)
    const eventId = await googleCalendarService.createEvent({
      clientName: appointment.clientName,
      clientEmail: appointment.clientEmail,
      clientPhone: appointment.clientPhone,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      notes: appointment.notes,
    });

    // STEP 7: Link Google Calendar event ID to appointment record
    if (eventId) {
      appointment.googleCalendarEventId = eventId;
      await appointment.save();
    }

    // STEP 8: Send confirmation email to the client (non-blocking)
    try {
      const to = appointment.clientEmail;
      if (!to) {
        console.warn(
          "[APPT][MAIL] Missing clientEmail, skipping send for appointment",
          appointment._id
        );
      } else {
        const includeZoom = !!(isZoomEnabled(req) && appointment.zoomJoinUrl);
        const startLabel = `${formatDate(
          new Date(appointment.appointmentDate)
        )} ${appointment.appointmentTime}`;
        const textBody =
          `Hi ${appointment.clientName}, your appointment is confirmed for ${startLabel}.` +
          (includeZoom ? `\n\n${buildZoomInviteText(appointment)}` : "");
        // Prefer EJS template if present; fall back to inline HTML helper
        let html;
        try {
          html = await ejs.renderFile(
            path.join(__dirname, "../views/emails/appointment-confirm.ejs"),
            {
              appointment,
              formatDate,
              buildZoomInviteHTML,
              buildZoomInviteText,
              includeZoom,
            },
            { async: true }
          );
          console.log("[APPT][MAIL] appointment-confirm.ejs rendered");
        } catch (tplErr) {
          console.warn(
            "[APPT][MAIL] template missing or failed, using inline HTML:",
            tplErr.message
          );
          html = renderAppointmentEmailHTML(appointment, { includeZoom });
        }

        const info = await sendMail({
          to,
          subject: `Appointment confirmed — ${startLabel}`,
          text: textBody,
          html,
        });
        console.log("[APPT][MAIL] sent", {
          messageId: info && info.messageId,
          to,
        });
      }
    } catch (mailErr) {
      console.error(
        "[APPT][MAIL] failed",
        mailErr && (mailErr.stack || mailErr.message || mailErr)
      );
    }

    // Return success response
    res.json({
      success: true,
      message: "Appointment booked successfully!",
      appointment,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json({
      success: false,
      message: "Error booking appointment. Please try again.",
    });
  }
};

/**
 * CREATE NEW APPOINTMENT (ADMIN ONLY)
 *
 * Allows an admin to manually create an appointment on behalf of a client.
 * This is different from the public booking flow because:
 * - Admin can book any date/time (even if it's not in the next 60 days UI)
 * - Admin can override scheduling logic
 * - We still generate a Zoom meeting automatically
 * - We still sync to Google Calendar
 *
 * Process:
 * 1. Read raw form data from admin dashboard
 * 2. Construct the appointment document
 * 3. Generate Zoom meeting for that slot (if Zoom is connected)
 * 4. Create Google Calendar event
 * 5. Save + respond
 *
 * Expected req.body fields from admin form:
 * - clientName        (string, required)
 * - clientEmail       (string, required)
 * - clientPhone       (string, optional)
 * - appointmentDate   (string "YYYY-MM-DD", required)
 * - appointmentTime   (string "HH:MM" or "HH:MM AM/PM" OR "2:00 PM - 2:30 PM")
 * - notes             (string, optional)
 * - _csrf             (string, ignored)
 */
const createAppointmentByAdmin = async (req, res) => {
  try {
    const {
      _csrf,
      clientName,
      clientEmail,
      clientPhone,
      appointmentDate,
      appointmentTime,
      notes,
    } = req.body;

    // Basic sanity: require minimum fields
    if (!clientName || !clientEmail || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields (clientName, clientEmail, appointmentDate, appointmentTime)",
      });
    }

    // We want a Date object for the start of the slot.
    // Your helpers assume "2:00 PM - 2:30 PM" format.
    // Admin form might just send "14:00". Let's normalize:
    let slotDisplayTime = appointmentTime;
    let slotDateTime;

    if (appointmentTime.includes("AM") || appointmentTime.includes("PM")) {
      // Admin gave something like "2:00 PM - 2:30 PM" or "2:00 PM"
      slotDateTime = createDateTime(new Date(appointmentDate), appointmentTime);
    } else {
      // Admin gave "14:00" or "14:00-14:30"
      // we'll convert "14:00" -> "2:00 PM - 2:30 PM" style string for storage/UI consistency
      // and build slotDateTime manually.
      const [startRaw] = appointmentTime.split("-");
      const [hourStr, minStr] = startRaw.trim().split(":");
      const h24 = parseInt(hourStr, 10);
      const m = parseInt(minStr || "0", 10);

      // make a Date at that time
      slotDateTime = new Date(appointmentDate);
      slotDateTime.setHours(h24, m, 0, 0);

      // build a nice "H:MM AM/PM - H:MM AM/PM" label for appointmentTime in DB
      const end = new Date(slotDateTime.getTime() + 30 * 60 * 1000); // +30min block
      slotDisplayTime =
        formatTime(h24 * 60 + m) +
        " - " +
        formatTime(
          end.getHours() * 60 + end.getMinutes()
        ); /* uses your helper */
    }

    // Create Appointment document
    const appointment = new Appointment({
      clientName,
      clientEmail,
      clientPhone,
      appointmentDate: new Date(appointmentDate),
      appointmentTime: slotDisplayTime,
      notes: notes || "",
      status: "confirmed",
    });

    const ZOOM_ENABLED = isZoomEnabled(req);
    let zoomInfo = null;
    try {
      if (
        ZOOM_ENABLED &&
        req.session.zoomConnected &&
        req.session.zoomAccessToken &&
        req.session.zoomUserId
      ) {
        if (typeof createZoomMeetingWithToken === "function") {
          zoomInfo = await createZoomMeetingWithToken({
            accessToken: req.session.zoomAccessToken,
            hostUserId: req.session.zoomUserId,
            topic: `Session with ${clientName}`,
            startTime: slotDateTime,
            durationMin: 30,
          });
        } else if (typeof createZoomMeeting === "function") {
          zoomInfo = await createZoomMeeting({
            topic: `Session with ${clientName}`,
            startTime: slotDateTime,
            durationMin: 30,
          });
        }
      }
    } catch (zoomErr) {
      console.error(
        "Admin Zoom creation failed:",
        zoomErr.response?.data || zoomErr
      );
      // do not block the booking if Zoom fails
    }

    // Attach zoom info if we got it
    if (zoomInfo) {
      appointment.zoomMeetingId = zoomInfo.meetingId;
      appointment.zoomJoinUrl = zoomInfo.joinUrl;
      appointment.zoomStartUrl = zoomInfo.startUrl;
    }

    // Save appointment now that it has Zoom data
    await appointment.save();

    // Create Google Calendar event
    try {
      const eventId = await googleCalendarService.createEvent({
        clientName: appointment.clientName,
        clientEmail: appointment.clientEmail,
        clientPhone: appointment.clientPhone,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        notes: appointment.notes,
        status: appointment.status,
      });

      if (eventId) {
        appointment.googleCalendarEventId = eventId;
        await appointment.save();
      }
    } catch (calErr) {
      console.error(
        "Google Calendar createEvent failed:",
        calErr.message || calErr
      );
      // don't block the response for calendar failure either
    }

    // ADMIN: Send confirmation email to the client (non-blocking)
    try {
      const to = appointment.clientEmail;
      if (!to) {
        console.warn(
          "[APPT-ADMIN][MAIL] Missing clientEmail, skipping send for appointment",
          appointment._id
        );
      } else {
        const includeZoom = !!(isZoomEnabled(req) && appointment.zoomJoinUrl);
        const startLabel = `${formatDate(
          new Date(appointment.appointmentDate)
        )} ${appointment.appointmentTime}`;
        const textBody =
          `Hi ${appointment.clientName}, your appointment is confirmed for ${startLabel}.` +
          (includeZoom ? `\n\n${buildZoomInviteText(appointment)}` : "");

        let html;
        try {
          html = await ejs.renderFile(
            path.join(__dirname, "../views/emails/appointment-confirm.ejs"),
            {
              appointment,
              formatDate,
              buildZoomInviteHTML,
              buildZoomInviteText,
              includeZoom,
            },
            { async: true }
          );
          console.log("[APPT-ADMIN][MAIL] appointment-confirm.ejs rendered");
        } catch (tplErr) {
          console.warn(
            "[APPT-ADMIN][MAIL] template missing or failed, using inline HTML:",
            tplErr.message
          );
          html = renderAppointmentEmailHTML(appointment, { includeZoom });
        }

        const info = await sendMail({
          to,
          subject: `Appointment confirmed — ${startLabel}`,
          text: textBody,
          html,
        });
        console.log("[APPT-ADMIN][MAIL] sent", {
          messageId: info && info.messageId,
          to,
        });
      }
    } catch (mailErr) {
      console.error(
        "[APPT-ADMIN][MAIL] failed",
        mailErr && (mailErr.stack || mailErr.message || mailErr)
      );
    }

    return res.redirect("/adminportal/appointments");
  } catch (err) {
    console.error("Error in createAppointmentByAdmin:", err);
    return res.status(500).json({
      success: false,
      message: "Error creating admin appointment",
    });
  }
};

/**
 * GET ALL APPOINTMENTS (ADMIN ONLY)
 *
 * Retrieves all appointments from the database, sorted by date and time.
 * Used by the admin dashboard to view all scheduled appointments.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with appointments array
 */
const getAllAppointments = async (req, res) => {
  try {
    // Fetch all appointments sorted by date and time (earliest first)
    const appointments = await Appointment.find().sort({
      appointmentDate: 1,
      appointmentTime: 1,
    });

    res.json({ success: true, appointments });
  } catch (error) {
    console.error("Error getting appointments:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving appointments",
    });
  }
};

/**
 * UPDATE APPOINTMENT STATUS (ADMIN ONLY)
 *
 * Updates the status of an existing appointment (e.g., pending → confirmed → completed).
 * Also syncs the status change with Google Calendar.
 *
 * Status options: 'pending', 'confirmed', 'cancelled', 'completed'
 *
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Appointment ID from URL
 * @param {string} req.body.status - New appointment status
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated appointment
 */
const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Find appointment by ID
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Update status in database
    appointment.status = status;
    await appointment.save();

    // Sync status change with Google Calendar
    if (appointment.googleCalendarEventId) {
      await googleCalendarService.updateEvent(
        appointment.googleCalendarEventId,
        {
          clientName: appointment.clientName,
          clientEmail: appointment.clientEmail,
          clientPhone: appointment.clientPhone,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
          notes: appointment.notes,
          status: appointment.status,
        }
      );
    }

    // Return updated appointment
    res.json({
      success: true,
      message: "Appointment updated successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({
      success: false,
      message: "Error updating appointment",
    });
  }
};

/**
 * DELETE APPOINTMENT (ADMIN ONLY)
 *
 * Permanently deletes an appointment from the database and removes it from Google Calendar.
 * Sends cancellation notifications to the client.
 *
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Appointment ID from URL
 * @param {Object} res - Express response object
 * @returns {Object} JSON response confirming deletion
 */
const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    // Find appointment by ID
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Delete from Google Calendar first (sends cancellation email)
    if (appointment.googleCalendarEventId) {
      await googleCalendarService.deleteEvent(
        appointment.googleCalendarEventId
      );
    }

    // Delete from database
    await Appointment.findByIdAndDelete(id);

    // Return success response
    res.json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting appointment",
    });
  }
};

/**
 * ==========================================
 * ADMIN AVAILABILITY MANAGEMENT (ADMIN ONLY)
 * ==========================================
 */

/**
 * GET ADMIN AVAILABILITY
 *
 * Retrieves the admin's weekly availability settings.
 * Returns availability for each day of the week with time slots.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with availabilities array
 */
const getAdminAvailability = async (req, res) => {
  try {
    // Fetch all availability settings sorted by day (Sunday=0 to Saturday=6)
    const availabilities = await AdminAvailability.find().sort({
      dayOfWeek: 1,
    });
    res.json({ success: true, availabilities });
  } catch (error) {
    console.error("Error getting availability:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving availability",
    });
  }
};

/**
 * SET ADMIN AVAILABILITY
 *
 * Updates or creates availability settings for a specific day of the week.
 * Admin can set which time slots are available for appointments.
 *
 * Process:
 * 1. Validate dayOfWeek is provided
 * 2. Check if availability exists for this day
 * 3. Update existing availability or create new one
 * 4. Save time slots and active status
 *
 * @param {Object} req - Express request object
 * @param {number} req.body.dayOfWeek - Day of week (0=Sunday, 6=Saturday)
 * @param {Array} req.body.timeSlots - Array of time slot objects {start, end}
 * @param {boolean} req.body.isActive - Whether this day is active
 * @param {string} req.body._csrf - CSRF token (excluded from database)
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated availability
 */
const setAdminAvailability = async (req, res) => {
  try {
    console.log("setAdminAvailability called with:", req.body);

    // Extract data (excluding CSRF token)
    const { _csrf, dayOfWeek, timeSlots, isActive } = req.body;

    // Validate that dayOfWeek is provided
    if (dayOfWeek === undefined || dayOfWeek === null) {
      return res.status(400).json({
        success: false,
        message: "dayOfWeek is required",
      });
    }

    // Check if availability already exists for this day
    let availability = await AdminAvailability.findOne({ dayOfWeek });

    if (availability) {
      // Update existing availability
      availability.timeSlots = timeSlots || [];
      availability.isActive =
        isActive !== undefined ? isActive : availability.isActive;
      await availability.save();
      console.log("Updated existing availability for day:", dayOfWeek);
    } else {
      // Create new availability for this day
      availability = new AdminAvailability({
        dayOfWeek,
        timeSlots: timeSlots || [],
        isActive: isActive !== undefined ? isActive : true,
      });
      await availability.save();
      console.log("Created new availability for day:", dayOfWeek);
    }

    // Return updated availability
    res.json({
      success: true,
      message: "Availability updated successfully",
      availability,
    });
  } catch (error) {
    console.error("Error setting availability:", error);
    res.status(500).json({
      success: false,
      message: "Error updating availability: " + error.message,
    });
  }
};

/**
 * ==========================================
 * BLOCKED DATE MANAGEMENT (ADMIN ONLY)
 * ==========================================
 */

/**
 * ADD BLOCKED DATE
 *
 * Blocks a specific date so clients cannot book appointments on that day.
 * Useful for holidays, vacations, or personal time.
 *
 * Process:
 * 1. Parse incoming date (handles both strings and Date objects)
 * 2. Create date in Pacific timezone to prevent day shift issues
 * 3. Save blocked date to database with optional reason
 *
 * Timezone Handling:
 * - Input: "2025-10-12" (date string in YYYY-MM-DD format)
 * - Creates: Date object at noon Pacific Time to avoid UTC conversion issues
 * - This ensures the blocked date displays correctly without shifting by one day
 *
 * @param {Object} req - Express request object
 * @param {string|Date} req.body.date - Date to block (YYYY-MM-DD format)
 * @param {string} req.body.reason - Optional reason for blocking
 * @param {string} req.body._csrf - CSRF token (excluded from database)
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with created blocked date
 */
const addBlockedDate = async (req, res) => {
  try {
    // Extract data (excluding CSRF token)
    const { _csrf, date, reason } = req.body;
    console.log("Received date to block:", date, "Type:", typeof date);

    // Handle dates in Pacific timezone to prevent day shift
    let dateToStore;
    if (typeof date === "string") {
      // Parse the date string and create a date in Pacific timezone
      // Input: "2025-10-12" -> Store as Pacific date at noon
      const [year, month, day] = date.split("-").map(Number);
      // Create date in Pacific timezone at noon (UTC-8 or UTC-7 depending on DST)
      // Using noon prevents timezone conversion from shifting the day
      dateToStore = new Date(year, month - 1, day, 12, 0, 0);
    } else {
      // If date is already a Date object, use it directly
      dateToStore = new Date(date);
    }

    console.log(
      "Storing date as:",
      dateToStore,
      "ISO:",
      dateToStore.toISOString()
    );

    // Create and save blocked date
    const blockedDate = new BlockedDate({
      date: dateToStore,
      reason: reason || "Admin blocked", // Default reason if none provided
    });
    await blockedDate.save();

    console.log("Saved blocked date:", blockedDate);

    // Return success response
    res.json({
      success: true,
      message: "Date blocked successfully",
      blockedDate,
    });
  } catch (error) {
    console.error("Error blocking date:", error);
    res.status(500).json({
      success: false,
      message: "Error blocking date",
    });
  }
};

/**
 * REMOVE BLOCKED DATE
 *
 * Removes a blocked date, allowing clients to book appointments on that day again.
 *
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Blocked date ID from URL
 * @param {Object} res - Express response object
 * @returns {Object} JSON response confirming removal
 */
const removeBlockedDate = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Attempting to delete blocked date with ID:", id);

    // Find and delete blocked date by ID
    const result = await BlockedDate.findByIdAndDelete(id);
    console.log("Delete result:", result);

    // Check if blocked date was found
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Blocked date not found",
      });
    }

    // Return success response
    res.json({
      success: true,
      message: "Blocked date removed successfully",
    });
  } catch (error) {
    console.error("Error removing blocked date:", error);
    res.status(500).json({
      success: false,
      message: "Error removing blocked date",
    });
  }
};

/**
 * GET BLOCKED DATES
 *
 * Retrieves all blocked dates from the database, sorted by date.
 * Used by admin dashboard to display blocked dates list.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with blocked dates array
 */
const getBlockedDates = async (req, res) => {
  try {
    // Fetch all blocked dates sorted by date (earliest first)
    const blockedDates = await BlockedDate.find().sort({ date: 1 });
    console.log(
      "Fetched blocked dates from DB:",
      blockedDates.map((bd) => ({
        id: bd._id,
        date: bd.date,
        dateType: typeof bd.date,
      }))
    );

    // Return blocked dates
    res.json({ success: true, blockedDates });
  } catch (error) {
    console.error("Error getting blocked dates:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving blocked dates",
    });
  }
};

/**
 * ==========================================
 * HELPER FUNCTIONS
 * ==========================================
 *
 * Utility functions for time slot generation, time parsing, and date formatting.
 * These functions handle the 30-minute appointment slot logic and time conversions.
 */

/**
 * GENERATE TIME SLOTS
 *
 * Breaks down a time range into 30-minute appointment slots.
 *
 * Example:
 * - Input: startTime = "9:00 AM", endTime = "11:00 AM"
 * - Output: ["9:00 AM - 9:30 AM", "9:30 AM - 10:00 AM", "10:00 AM - 10:30 AM", "10:30 AM - 11:00 AM"]
 *
 * @param {string} startTime - Start time in "H:MM AM/PM" format
 * @param {string} endTime - End time in "H:MM AM/PM" format
 * @returns {Array} Array of time slot strings
 */
function generateTimeSlots(startTime, endTime) {
  const slots = [];
  const start = parseTime(startTime); // Convert to minutes
  const end = parseTime(endTime); // Convert to minutes

  let current = start;
  while (current < end) {
    const next = current + 30; // Add 30 minutes for each slot
    slots.push(`${formatTime(current)} - ${formatTime(next)}`);
    current = next;
  }

  return slots;
}

/**
 * PARSE TIME TO MINUTES
 *
 * Converts time string in 12-hour format to total minutes since midnight.
 * Used for time calculations and comparisons.
 *
 * Examples:
 * - "9:00 AM" → 540 (9 * 60)
 * - "2:30 PM" → 870 (14 * 60 + 30)
 * - "12:00 PM" → 720 (12 * 60)
 * - "12:00 AM" → 0 (midnight)
 *
 * @param {string} timeStr - Time in "H:MM AM/PM" format
 * @returns {number} Total minutes since midnight
 */
function parseTime(timeStr) {
  const [time, period] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  // Convert 12-hour format to 24-hour format
  if (period === "PM" && hours !== 12) {
    hours += 12; // 1 PM → 13, 2 PM → 14, etc.
  } else if (period === "AM" && hours === 12) {
    hours = 0; // 12 AM → 0 (midnight)
  }

  return hours * 60 + minutes; // Return total minutes
}

/**
 * FORMAT TIME FROM MINUTES
 *
 * Converts total minutes since midnight back to 12-hour time format.
 *
 * Examples:
 * - 540 → "9:00 AM"
 * - 870 → "2:30 PM"
 * - 720 → "12:00 PM"
 * - 0 → "12:00 AM"
 *
 * @param {number} minutes - Total minutes since midnight
 * @returns {string} Time in "H:MM AM/PM" format
 */
function formatTime(minutes) {
  let hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? "PM" : "AM";

  // Convert 24-hour format to 12-hour format
  if (hours > 12) hours -= 12; // 13 → 1, 14 → 2, etc.
  if (hours === 0) hours = 12; // 0 → 12 (midnight)

  // Pad minutes with leading zero if needed (e.g., 9:05 not 9:5)
  return `${hours}:${mins.toString().padStart(2, "0")} ${period}`;
}

/**
 * FORMAT DATE FOR DISPLAY
 *
 * Formats a date object into a human-readable string.
 *
 * Example:
 * - Input: Date object for 2025-10-15
 * - Output: "Wednesday, October 15, 2025"
 *
 * @param {Date} date - JavaScript Date object
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}

/**
 * CREATE DATE TIME OBJECT
 *
 * Combines a date and time string into a single Date object.
 * Used to check if a time slot is in the past or future.
 *
 * Example:
 * - Input: date = Date(2025-10-15), timeStr = "2:00 PM - 2:30 PM"
 * - Output: Date object for October 15, 2025 at 2:00 PM
 *
 * @param {Date} date - JavaScript Date object
 * @param {string} timeStr - Time slot string (e.g., "2:00 PM - 2:30 PM")
 * @returns {Date} Combined Date object with date and time
 */
function createDateTime(date, timeStr) {
  const newDate = new Date(date);
  const [time] = timeStr.split(" - "); // Extract start time from "2:00 PM - 2:30 PM"
  const [timePart, period] = time.split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);

  // Convert 12-hour format to 24-hour format
  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }

  // Set the time on the date object
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
}

/**
 * ==========================================
 * MODULE EXPORTS
 * ==========================================
 *
 * Export all controller functions for use in route handlers.
 * These functions are imported by routes/appointment-routes.js
 */
module.exports = {
  // Public endpoints (available to all users)
  getAvailableSlots, // GET /api/appointments/available - Get available time slots
  createAppointment, // POST /api/appointments - Book new appointment

  // Admin endpoints (require admin authentication)
  createAppointmentByAdmin, // POST /appointments/adminportal/create (admin creates appointment)

  getAllAppointments, // GET /api/appointments/adminportal/appointments - List all appointments
  updateAppointmentStatus, // PUT /api/appointments/adminportal/appointments/:id/status - Update appointment status
  deleteAppointment, // DELETE /api/appointments/adminportal/appointments/:id - Cancel/delete appointment
  getAdminAvailability, // GET /api/appointments/adminportal/availability - Get weekly availability
  setAdminAvailability, // PUT /api/appointments/adminportal/availability - Update weekly availability
  addBlockedDate, // POST /api/appointments/adminportal/blocked-dates - Block a date
  removeBlockedDate, // DELETE /api/appointments/adminportal/blocked-dates/:id - Unblock a date
  getBlockedDates, // GET /api/appointments/adminportal/blocked-dates - List blocked dates
};

// ===========================
// APPOINTMENT EMAIL HTML HELPER
// ===========================
/**
 * Renders the HTML email for appointment confirmation, including Zoom invite block.
 * @param {Object} appointment
 * @param {Object} opts - { includeZoom: boolean }
 * @returns {string} HTML string
 */
function renderAppointmentEmailHTML(appointment, opts = {}) {
  const includeZoom = !!opts.includeZoom;
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff;font-family:sans-serif;">
      <tr>
        <td style="padding:32px 24px 24px 24px; font-size:16px;">
          <div style="font-size:20px;font-weight:700;margin-bottom:18px;">
            Appointment Confirmation
          </div>
          <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;">
            <tr>
              <td><strong>Name:</strong></td>
              <td>${appointment.clientName || ""}</td>
            </tr>
            <tr>
              <td><strong>Email:</strong></td>
              <td>${appointment.clientEmail || ""}</td>
            </tr>
            <tr>
              <td><strong>Date:</strong></td>
              <td>${
                appointment.appointmentDate
                  ? formatDate(new Date(appointment.appointmentDate))
                  : ""
              }</td>
            </tr>
            <tr>
              <td><strong>Time:</strong></td>
              <td>${appointment.appointmentTime || ""}</td>
            </tr>
            ${
              appointment.notes
                ? `<tr><td><strong>Notes:</strong></td><td>${appointment.notes}</td></tr>`
                : ""
            }
          </table>
          ${
            includeZoom
              ? `
          <div style="margin-top:16px;padding-top:12px;border-top:1px solid #eee;">
            <div style="font-weight:700;margin-bottom:6px;">Zoom Invite</div>
            <div style="font-size:13px;line-height:1.55;">${buildZoomInviteHTML(
              appointment
            )}</div>
          </div>`
              : ""
          }
        </td>
      </tr>
    </table>
  `;
}
