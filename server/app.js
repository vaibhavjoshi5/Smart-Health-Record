const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const compression = require('compression');
const hpp = require('hpp');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '.env') });

const { connectDB } = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const { router: authRouter } = require('./routes/auth');
const { router: medicalRecordsRouter } = require('./routes/medicalRecords');
const { router: doctorRouter } = require('./routes/doctor');
const { router: patientRouter } = require('./routes/patient');
const { router: profileRouter } = require('./routes/profile');
const { router: appointmentRouter } = require('./routes/appointment');
const { router: aiRouter } = require('./routes/ai');
const chatRoutes = require('./routes/chat');

const app = express();
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].filter(Boolean);

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(hpp());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true, limit: '4mb' }));
app.use(compression());

let connectionPromise;
app.use('/api', async (req, res, next) => {
  if (!connectionPromise) connectionPromise = connectDB();
  await connectionPromise;
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ success: false, message: 'Database is temporarily unavailable' });
  }
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/medical-records', apiLimiter, medicalRecordsRouter);
app.use('/api/doctor', apiLimiter, doctorRouter);
app.use('/api/patient', apiLimiter, patientRouter);
app.use('/api/profile', apiLimiter, profileRouter);
app.use('/api/appointment', apiLimiter, appointmentRouter);
app.use('/api/ai', apiLimiter, aiRouter);
app.use('/api/chat', apiLimiter, chatRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});
app.use(errorHandler);

module.exports = app;
