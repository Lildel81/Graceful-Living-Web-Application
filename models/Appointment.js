const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema(
  {
    ownerKey: {
      type: String,
      required: true,
      default: "default-admin",
      index: true,
    },

    title: { type: String, required: true },
    clientName: { type: String },
    clientEmail: { type: String, required: true },

    start: { type: Date, required: true, index: true },
    end: { type: Date, required: true },
    duration: { type: Number, default: 30 }, // minutes
    timezone: { type: String, default: "UTC" },

    location_type: {
      type: String,
      enum: ["zoom", "in_person", "phone"],
      default: "zoom",
    },
    zoom: {
      join_url: { type: String, default: null },
      start_url: { type: String, default: null },
      meeting_id: { type: String, default: null },
    },

    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", AppointmentSchema);
