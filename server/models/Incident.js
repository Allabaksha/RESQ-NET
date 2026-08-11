const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  description: { type: String, required: true },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  address: String,
  aiAnalysis: {
    incidentType: String,
    severity: { type: String, enum: ["Low", "Moderate", "High", "Critical"] },
    estimatedVictims: String,
    suggestedResources: [String],
    reviewedByOfficer: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ["Reported", "Under Review", "Assigned", "In Progress", "Resolved", "Closed"],
    default: "Reported"
  },
  priority: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
  assignedAgencies: [{
    agency: { type: mongoose.Schema.Types.ObjectId, ref: "Agency" },
    assignedAt: { type: Date, default: Date.now },
    enRouteAt: Date,          // when the unit departed for the scene
    arrivedAt: Date,          // when the unit reached the scene
    completedAt: Date,        // when the unit finished its mission
    responseStatus: { 
      type: String, 
      enum: ["Pending", "Accepted", "Rejected", "En Route", "On Scene", "Completed"], 
      default: "Pending" 
    }
  }],
  timeline: [{
    event: String,
    timestamp: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  }]
}, { timestamps: true });

IncidentSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('Incident', IncidentSchema);
