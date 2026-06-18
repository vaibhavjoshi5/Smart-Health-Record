const express = require('express');
const router = express.Router();
const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
const { authMiddleware } = require('./auth');
const asyncHandler = require('../middleware/asyncHandler');

// 1. View patients assigned to this doctor (by medical records)
router.get('/patients/:doctorId', authMiddleware, asyncHandler(async (req, res) => {
  const records = await MedicalRecord.find({ doctor: req.params.doctorId }).populate('patient', 'name email');
  // Unique patients
  const patients = {};
  records.forEach(r => {
    if (r.patient && r.patient._id) patients[r.patient._id] = r.patient;
  });
  res.json(Object.values(patients));
}));

// 2. Add medical entry for a patient
router.post('/add-entry', authMiddleware, asyncHandler(async (req, res) => {
  const { patientId, doctorId, date, symptoms, diagnosis, doctorNotes } = req.body;
  const record = new MedicalRecord({
    patient: patientId,
    doctor: doctorId,
    date,
    symptoms,
    diagnosis,
    doctorNotes
  });
  await record.save();
  res.status(201).json({ success: true, message: 'Medical entry added', record });
}));

// 3. Download summary report for a patient (all records as JSON)
router.get('/summary/:patientId', authMiddleware, asyncHandler(async (req, res) => {
  const records = await MedicalRecord.find({ patient: req.params.patientId }).populate('doctor', 'name');
  res.setHeader('Content-Disposition', 'attachment; filename=summary.json');
  res.json(records);
}));

module.exports = { router };