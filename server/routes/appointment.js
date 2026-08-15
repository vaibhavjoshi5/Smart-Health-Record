const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { authMiddleware, requireRole, requireSelfOrRole } = require('./auth');
const asyncHandler = require('../middleware/asyncHandler');
const { AppError } = require('../middleware/errorHandler');

// 1. Book appointment
router.post('/book', authMiddleware, requireRole('patient'), asyncHandler(async (req, res) => {
  const { patientId, doctorId, date, time } = req.body;
  if (String(patientId) !== String(req.user.id)) {
    return res.status(403).json({ success: false, message: 'Patient identity does not match authenticated user' });
  }
  const doctor = await require('../models/User').findOne({ _id: doctorId, role: 'doctor' });
  if (!doctor) throw new AppError('Doctor not found', 404);
  const appointment = new Appointment({ patient: patientId, doctor: doctorId, date, time });
  await appointment.save();
  res.status(201).json({ success: true, message: 'Appointment booked', appointment });
}));

// 2. View appointments by patient
router.get('/patient/:patientId', authMiddleware, requireSelfOrRole('doctor'), asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({ patient: req.params.patientId }).populate('doctor', 'name');
  res.json(appointments);
}));

// 3. View appointments by doctor
router.get('/doctor/:doctorId', authMiddleware, requireRole('doctor'), requireSelfOrRole(), asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({ doctor: req.params.doctorId }).populate('patient', 'name');
  res.json(appointments);
}));

// 4. Update appointment status
router.put('/status/:id', authMiddleware, requireRole('doctor'), asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['confirmed', 'approved', 'completed', 'cancelled'].includes(status)) {
    throw new AppError('Invalid appointment status', 400);
  }
  const appointment = await Appointment.findOneAndUpdate(
    { _id: req.params.id, doctor: req.user.id },
    { status },
    { new: true, runValidators: true }
  );
  if (!appointment) throw new AppError('Appointment not found', 404);
  res.json({ success: true, appointment });
}));

// 5. Cancel appointment
router.delete('/cancel/:id', authMiddleware, asyncHandler(async (req, res) => {
  const appointment = await Appointment.findOne({ _id: req.params.id });
  if (!appointment) throw new AppError('Appointment not found', 404);
  const ownsAppointment = [appointment.patient, appointment.doctor].some(id => String(id) === String(req.user.id));
  if (!ownsAppointment) throw new AppError('You are not allowed to cancel this appointment', 403);
  appointment.status = 'cancelled';
  await appointment.save();
  res.json({ success: true, message: 'Appointment cancelled' });
}));

module.exports = { router };
