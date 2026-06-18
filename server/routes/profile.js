const express = require('express');
const router = express.Router();
const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');
const { authMiddleware } = require('./auth');
const asyncHandler = require('../middleware/asyncHandler');
const { AppError } = require('../middleware/errorHandler');

// 0. Get all users (for appointment booking dropdown)
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
}));

// 1. Update user details
router.put('/update/:userId', authMiddleware, asyncHandler(async (req, res) => {
  const { name, bloodGroup, allergies, chronicDiseases, emergencyContact } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { name, bloodGroup, allergies, chronicDiseases, emergencyContact },
    { new: true }
  );
  if (!user) throw new AppError('User not found', 404);
  res.json(user);
}));

// 2. Get user profile
router.get('/:userId', authMiddleware, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select('-password');
  if (!user) throw new AppError('User not found', 404);
  res.json(user);
}));

// 3. Export all records for a user (as JSON)
router.get('/export/:userId', authMiddleware, asyncHandler(async (req, res) => {
  const records = await MedicalRecord.find({ patient: req.params.userId }).populate('doctor', 'name');
  res.setHeader('Content-Disposition', 'attachment; filename=records.json');
  res.json(records);
}));

module.exports = { router };