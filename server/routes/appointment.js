const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { authMiddleware } = require('./auth');

// 1. Book appointment
router.post('/book', authMiddleware, async (req, res) => {
  try {
    const { patientId, doctorId, date, time } = req.body;
    const appointment = new Appointment({ patient: patientId, doctor: doctorId, date, time });
    await appointment.save();
    res.status(201).json({ message: 'Appointment booked', appointment });
  } catch (err) {
    res.status(500).json({ message: 'Error booking appointment' });
  }
});

// 2. View appointments by patient
router.get('/patient/:patientId', authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.params.patientId }).populate('doctor', 'name');
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching appointments' });
  }
});

// 3. View appointments by doctor
router.get('/doctor/:doctorId', authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.params.doctorId }).populate('patient', 'name');
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching appointments' });
  }
});

// 4. Update appointment status
router.put('/status/:id', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: 'Error updating status' });
  }
});

// 5. Cancel appointment
router.delete('/cancel/:id', authMiddleware, async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appointment cancelled' });
  } catch (err) {
    res.status(500).json({ message: 'Error cancelling appointment' });
  }
});

module.exports = { router }; 