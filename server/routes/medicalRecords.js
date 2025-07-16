const express = require('express');
const router = express.Router();
const multer = require('multer');
const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('./auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Upload a medical record
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { patientId, doctorId, date, symptoms, diagnosis, doctorNotes } = req.body;
    const fileUrl = req.file ? req.file.path : null;
    const record = new MedicalRecord({
      patient: patientId,
      doctor: doctorId,
      date,
      symptoms,
      diagnosis,
      doctorNotes,
      fileUrl
    });
    await record.save();
    res.status(201).json({ message: 'Medical record uploaded', record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error uploading record' });
  }
});

// Get all records for a patient
router.get('/patient/:patientId', authMiddleware, async (req, res) => {
  try {
    const records = await MedicalRecord.find({ patient: req.params.patientId }).populate('doctor', 'name');
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching records' });
  }
});

// Download a record file
router.get('/download/:id', authMiddleware, async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record || !record.fileUrl) return res.status(404).json({ message: 'File not found' });
    res.download(path.resolve(record.fileUrl));
  } catch (err) {
    res.status(500).json({ message: 'Error downloading file' });
  }
});

module.exports = { router }; 