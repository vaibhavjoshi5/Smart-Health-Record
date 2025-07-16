const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor'], default: 'patient' },
  bloodGroup: { type: String },
  allergies: [{ type: String }],
  chronicDiseases: [{ type: String }],
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
