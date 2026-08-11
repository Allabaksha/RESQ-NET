const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ["citizen", "agency", "officer", "admin"], 
    default: "citizen" 
  },
  agency: { type: mongoose.Schema.Types.ObjectId, ref: "Agency" }, // populated if role = agency
  phone: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
