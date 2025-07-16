const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, required: true },
  symptoms: { type: String },
  diagnosis: { type: String },
  doctorNotes: { type: String },
  fileUrl: { type: String }, // URL or path to uploaded file (PDF/image)
}, { timestamps: true });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema); 