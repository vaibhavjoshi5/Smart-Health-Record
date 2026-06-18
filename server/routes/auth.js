const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('../middleware/asyncHandler');
const logger = require('../config/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// JWT middleware
function authMiddleware(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token is not valid' });
  }
}

// 🔐 Signup Route
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required').trim().escape(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['patient', 'doctor'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

  const { name, email, password, role } = req.body;
  let user = await User.findOne({ email });
  if (user) return res.status(400).json({ success: false, message: 'User already exists' });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  user = new User({ name, email, password: hashedPassword, role });
  await user.save();

  logger.info(`New user registered: ${email} (${role || 'patient'})`);
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user: { _id: user._id, name: user.name, email: user.email, role: user.role }
  });
}));

// 🔑 Login Route
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  logger.info(`User logged in: ${email}`);
  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role }
  });
}));

// Forgot Password
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ success: false, message: 'No user with that email' });

  const token = crypto.randomBytes(32).toString('hex');
  user.resetToken = token;
  user.resetTokenExpiry = Date.now() + 1000 * 60 * 60; // 1 hour
  await user.save();

  // Send email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;
  await transporter.sendMail({
    to: user.email,
    subject: 'Password Reset',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link is valid for 1 hour.</p>`
  });

  logger.info(`Password reset email sent to: ${email}`);
  res.json({ success: true, message: 'Password reset email sent' });
}));

// Reset Password
router.post('/reset-password/:token', [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

  const { password } = req.body;
  const user = await User.findOne({ resetToken: req.params.token, resetTokenExpiry: { $gt: Date.now() } });
  if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  logger.info(`Password reset successful for user: ${user.email}`);
  res.json({ success: true, message: 'Password reset successful' });
}));

module.exports = {
  router,
  authMiddleware
};