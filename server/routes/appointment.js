const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { authMiddleware } = require('./auth');
const asyncHandler = require('../middleware/asyncHandler');
const { AppError } = require('../middleware/errorHandler');

// 1. Book appointment
router.post('/book', authMiddleware, asyncHandler(async (req, res) => {
  const { patientId, doctorId, date, time } = req.body;
  const appointment = new Appointment({ patient: patientId, doctor: doctorId, date, time });
  await appointment.save();
  res.status(201).json({ success: true, message: 'Appointment booked', appointment });
}));

// 2. View appointments by patient
router.get('/patient/:patientId', authMiddleware, asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({ patient: req.params.patientId }).populate('doctor', 'name');
  res.json(appointments);
}));

// 3. View appointments by doctor
router.get('/doctor/:doctorId', authMiddleware, asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({ doctor: req.params.doctorId }).populate('patient', 'name');
  res.json(appointments);
}));

// 4. Update appointment status
router.put('/status/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { status } = req.body;
  const appointment = await Appointment.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!appointment) throw new AppError('Appointment not found', 404);
  res.json({ success: true, appointment });
}));

// 5. Cancel appointment
router.delete('/cancel/:id', authMiddleware, asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByIdAndDelete(req.params.id);
  if (!appointment) throw new AppError('Appointment not found', 404);
  res.json({ success: true, message: 'Appointment cancelled' });
}));

module.exports = { router };