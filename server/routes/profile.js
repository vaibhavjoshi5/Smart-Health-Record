const express = require('express');
const router = express.Router();
const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');
const { authMiddleware } = require('./auth');

// 0. Get all users (for appointment booking dropdown)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// 1. Update user details
router.put('/update/:userId', authMiddleware, async (req, res) => {
  try {
    const { name, bloodGroup, allergies, chronicDiseases, emergencyContact } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { name, bloodGroup, allergies, chronicDiseases, emergencyContact },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// 2. Get user profile
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// 3. Export all records for a user (as JSON)
router.get('/export/:userId', authMiddleware, async (req, res) => {
  try {
    const records = await MedicalRecord.find({ patient: req.params.userId }).populate('doctor', 'name');
    res.setHeader('Content-Disposition', 'attachment; filename=records.json');
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Error exporting records' });
  }
});

module.exports = { router };