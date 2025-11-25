/**
 * APPOINTMENT MODEL
 *
 * This file defines the database schema and validation for appointment bookings
 * in the GracefuLiving coaching platform. It handles client appointment data,
 * Google Calendar integration, and appointment status management.
 *
 * Key Features:
 * - Client information storage (name, email, phone)
 * - Appointment scheduling (date, time, notes)
 * - Status tracking (pending, confirmed, cancelled, completed)
 * - Google Calendar event synchronization
 * - Input validation using Joi
 * - CSRF token support for security
 */

// Import required dependencies
const mongoose = require("mongoose"); // MongoDB object modeling tool
const Joi = require("joi"); // Schema validation library

/**
 * APPOINTMENT SCHEMA DEFINITION
 *
 * Defines the structure of appointment documents in MongoDB.
 * Each appointment contains client info, scheduling details, and tracking data.
 */
const appointmentSchema = new mongoose.Schema({
  //user id to for user dashboard
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  // CLIENT INFORMATION FIELDS
  clientName: {
    type: String,
    required: true, // Must be provided
    minlength: 1, // At least 1 character
    maxlength: 100, // Maximum 100 characters
  },
  clientEmail: {
    type: String,
    required: true, // Must be provided
    minlength: 5, // Minimum valid email length
    maxlength: 100, // Maximum email length
  },
  clientPhone: {
    type: String,
    required: true, // Must be provided
    minlength: 10, // Minimum phone number length
    maxlength: 20, // Maximum phone number length
  },

  // APPOINTMENT SCHEDULING FIELDS
  appointmentDate: {
    type: Date,
    required: true, // Must be provided
  },
  appointmentTime: {
    type: String, // Stored as string (e.g., "2:00 PM - 2:30 PM")
    required: true, // Must be provided
  },
  notes: {
    type: String,
    maxlength: 500, // Optional notes, max 500 characters
  },

  // APPOINTMENT STATUS TRACKING
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "completed"], // Only these values allowed
    default: "confirmed", // New appointments are confirmed by default
  },

  // GOOGLE CALENDAR INTEGRATION
  googleCalendarEventId: {
    type: String,
    default: null, // Stores the Google Calendar event ID for sync
  },

  // AUTOMATIC TIMESTAMPS
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set when appointment is created
  },

  // ZOOM INTEGRATION FIELDS
  zoomMeetingId: {
    type: String,
    default: null, // Zoom's meeting ID
  },
  zoomJoinUrl: {
    type: String,
    default: null, // Link the client uses to join
  },
  zoomStartUrl: {
    type: String,
    default: null, // Host-only link
  },
});

// Create the Appointment model from the schema
const Appointment = mongoose.model("Appointment", appointmentSchema);

/**
 * APPOINTMENT VALIDATION FUNCTION
 *
 * Validates appointment data using Joi schema validation.
 * This ensures data integrity before saving to the database.
 *
 * @param {Object} appointment - The appointment data to validate
 * @returns {Object} - Validation result with error details if invalid
 */
const validateAppointment = (appointment) => {
  // Define validation schema using Joi
  const schema = Joi.object({
    _csrf: Joi.string().optional(), // CSRF token for security (optional)
    clientName: Joi.string().min(1).max(100).required(), // Client name validation
    clientEmail: Joi.string().email().min(5).max(100).required(), // Email validation
    clientPhone: Joi.string().min(10).max(20).required(), // Phone validation
    appointmentDate: Joi.date().required(), // Date validation
    appointmentTime: Joi.string().required(), // Time validation
    notes: Joi.string().max(500).allow("").optional(), // Optional notes
    status: Joi.string()
      .valid("pending", "confirmed", "cancelled", "completed")
      .optional(), // Status validation
  });

  // Return validation result
  return schema.validate(appointment);
};

// Export the model and validation function for use in other files
module.exports = Appointment; // Export the Appointment model
module.exports.validate = validateAppointment; // Export the validation function
