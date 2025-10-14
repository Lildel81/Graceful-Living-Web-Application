const mongoose = require("mongoose");

const ZoomAuthSchema = new mongoose.Schema(
  {
    // For now you have one admin; later store a real adminId
    ownerKey: {
      type: String,
      required: true,
      unique: true,
      default: "default-admin",
    },

    access_token: String,
    refresh_token: String,
    expires_at: Number,
    scope: String,

    zoom_user_id: String,
    zoom_email: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("ZoomAuth", ZoomAuthSchema);
