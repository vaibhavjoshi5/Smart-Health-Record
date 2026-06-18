const express = require('express');
const router = express.Router();
const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
const { authMiddleware } = require('./auth');
const asyncHandler = require('../middleware/asyncHandler');
const { AppError } = require('../middleware/errorHandler');

// 1. View medical timeline (all records, sorted by date desc)
router.get('/timeline/:patientId', authMiddleware, asyncHandler(async (req, res) => {
  const records = await MedicalRecord.find({ patient: req.params.patientId })
    .sort({ date: -1 })
    .populate('doctor', 'name');
  res.json(records);
}));

// 2. Search records by date or symptom
router.get('/search/:patientId', authMiddleware, asyncHandler(async (req, res) => {
  const { date, symptom } = req.query;
  let query = { patient: req.params.patientId };
  if (date) query.date = new Date(date);
  if (symptom) query.symptoms = { $regex: symptom, $options: 'i' };
  const records = await MedicalRecord.find(query).populate('doctor', 'name');
  res.json(records);
}));

// 3. Get health graphs data (BP, Sugar if present in doctorNotes or diagnosis)
router.get('/health-graphs/:patientId', authMiddleware, asyncHandler(async (req, res) => {
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
}));

// 4. Get emergency contact QR code data (return contact info for now)
router.get('/emergency-contact/:patientId', authMiddleware, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.patientId);
  if (!user || !user.emergencyContact) {
    throw new AppError('No emergency contact found', 404);
  }
  res.json(user.emergencyContact);
}));

module.exports = { router };