const express = require('express');
const router = express.Router();
const multer = require('multer');
const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('./auth');
const asyncHandler = require('../middleware/asyncHandler');
const { AppError } = require('../middleware/errorHandler');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Only PDF and image files are allowed', 400), false);
    }
  }
});

// Upload a medical record
router.post('/upload', authMiddleware, upload.single('file'), asyncHandler(async (req, res) => {
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
  res.status(201).json({ success: true, message: 'Medical record uploaded', record });
}));

// Get all records for a patient
router.get('/patient/:patientId', authMiddleware, asyncHandler(async (req, res) => {
  const records = await MedicalRecord.find({ patient: req.params.patientId }).populate('doctor', 'name');
  res.json(records);
}));

// Download a record file
router.get('/download/:id', authMiddleware, asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id);
  if (!record || !record.fileUrl) {
    throw new AppError('File not found', 404);
  }
  res.download(path.resolve(record.fileUrl));
}));

module.exports = { router };