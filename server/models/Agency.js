const mongoose = require('mongoose');

const AgencySchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ["Fire & Rescue", "Ambulance", "Police", "NDRF", "SDRF", "Civil Defence", "NGO", "Other"],
    required: true
  },
  registrationId: { type: String, unique: true, required: true },
  contact: {
    phone: String,
    email: String,
    officerInCharge: String
  },
  baseLocation: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  currentLocation: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  status: {
    type: String,
    enum: ["Available", "Busy", "Unavailable"],
    default: "Available"
  },
  capacity: {
    personnel: { type: Number, default: 0 },
    vehicles: { type: Number, default: 0 }
  },
  verified: { type: Boolean, default: false },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

AgencySchema.index({ currentLocation: "2dsphere" });
AgencySchema.index({ baseLocation: "2dsphere" });

module.exports = mongoose.model('Agency', AgencySchema);
