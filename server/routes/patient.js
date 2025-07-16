const express = require('express');
const router = express.Router();
const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
const { authMiddleware } = require('./auth');

// 1. View medical timeline (all records, sorted by date desc)
router.get('/timeline/:patientId', authMiddleware, async (req, res) => {
  try {
    const records = await MedicalRecord.find({ patient: req.params.patientId })
      .sort({ date: -1 })
      .populate('doctor', 'name');
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching timeline' });
  }
});

// 2. Search records by date or symptom
router.get('/search/:patientId', authMiddleware, async (req, res) => {
  try {
    const { date, symptom } = req.query;
    let query = { patient: req.params.patientId };
    if (date) query.date = new Date(date);
    if (symptom) query.symptoms = { $regex: symptom, $options: 'i' };
    const records = await MedicalRecord.find(query).populate('doctor', 'name');
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Error searching records' });
  }
});

// 3. Get health graphs data (BP, Sugar if present in doctorNotes or diagnosis)
router.get('/health-graphs/:patientId', authMiddleware, async (req, res) => {
  try {
    const records = await MedicalRecord.find({ patient: req.params.patientId });
    // Extract BP and Sugar values from doctorNotes or diagnosis (simple regex)
    const bpData = [];
    const sugarData = [];
    records.forEach(r => {
      const bpMatch = /BP[:\s]+(\d{2,3}\/\d{2,3})/i.exec(r.doctorNotes || r.diagnosis || '');
      if (bpMatch) bpData.push({ date: r.date, value: bpMatch[1] });
      const sugarMatch = /Sugar[:\s]+(\d{2,3})/i.exec(r.doctorNotes || r.diagnosis || '');
      if (sugarMatch) sugarData.push({ date: r.date, value: sugarMatch[1] });
    });
    res.json({ bp: bpData, sugar: sugarData });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching health graph data' });
  }
});

// 4. Get emergency contact QR code data (return contact info for now)
router.get('/emergency-contact/:patientId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.patientId);
    if (!user || !user.emergencyContact) return res.status(404).json({ message: 'No emergency contact' });
    res.json(user.emergencyContact);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching emergency contact' });
  }
});

module.exports = { router }; 