const express = require('express');
const router = express.Router();
const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
const { authMiddleware } = require('./auth');

// 1. View patients assigned to this doctor (by medical records)
router.get('/patients/:doctorId', authMiddleware, async (req, res) => {
  try {
    const records = await MedicalRecord.find({ doctor: req.params.doctorId }).populate('patient', 'name email');
    // Unique patients
    const patients = {};
    records.forEach(r => {
      if (r.patient && r.patient._id) patients[r.patient._id] = r.patient;
    });
    res.json(Object.values(patients));
  } catch (err) {
    res.status(500).json({ message: 'Error fetching patients' });
  }
});

// 2. Add medical entry for a patient
router.post('/add-entry', authMiddleware, async (req, res) => {
  try {
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
    res.status(201).json({ message: 'Medical entry added', record });
  } catch (err) {
    res.status(500).json({ message: 'Error adding entry' });
  }
});

// 3. Download summary report for a patient (all records as JSON)
router.get('/summary/:patientId', authMiddleware, async (req, res) => {
  try {
    const records = await MedicalRecord.find({ patient: req.params.patientId }).populate('doctor', 'name');
    res.setHeader('Content-Disposition', 'attachment; filename=summary.json');
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Error downloading summary' });
  }
});

module.exports = { router }; 