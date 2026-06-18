// server.js - Smart Health Record Backend
// Industry-standard Express server with clustering, security, and logging

const cluster = require('cluster');
const os = require('os');
const logger = require('./config/logger');

// ─── Cluster Mode: Fork workers for multi-core processing ───
const NUM_WORKERS = Math.min(os.cpus().length, 4); // Cap at 4 workers

if (cluster.isPrimary) {
  cluster.setupPrimary({ exec: __filename });
  logger.info(`🚀 Primary process ${process.pid} starting ${NUM_WORKERS} workers...`);

  for (let i = 0; i < NUM_WORKERS; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`⚠️ Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
    cluster.fork(); // Auto-restart crashed workers
  });

  cluster.on('online', (worker) => {
    logger.info(`✅ Worker ${worker.process.pid} is online`);
  });
} else {
  // ─── Worker Process: Express Application ───
  const express = require("express");
  const cors = require("cors");
  const dotenv = require("dotenv");
  const helmet = require("helmet");
  const compression = require("compression");
  const morgan = require("morgan");
  const hpp = require("hpp");
  const fs = require('fs');
  const http = require('http');
  const { Server } = require('socket.io');

  // Load environment variables
  dotenv.config();

  // Database connection
  const { connectDB, disconnectDB } = require('./config/db');

  // Middleware
  const { errorHandler } = require('./middleware/errorHandler');
  const { apiLimiter, authLimiter, uploadLimiter } = require('./middleware/rateLimiter');

  // Route imports
  const { router: authRouter, authMiddleware } = require('./routes/auth');
  const { router: medicalRecordsRouter } = require('./routes/medicalRecords');
  const { router: doctorRouter } = require('./routes/doctor');
  const { router: patientRouter } = require('./routes/patient');
  const { router: profileRouter } = require('./routes/profile');
  const { router: appointmentRouter } = require('./routes/appointment');
  const { router: aiRouter } = require('./routes/ai');
  const chatRoutes = require('./routes/chat');
  const Chat = require('./models/Chat');

  const app = express();
  const server = http.createServer(app);

  // ─── Socket.io with proper CORS ───
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ─── Security Middleware ───
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));
  app.use(hpp()); // Protect against HTTP Parameter Pollution

  // ─── CORS Configuration ───
  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // ─── Body Parsing ───
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ─── Response Compression ───
  app.use(compression({
    level: 6,
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
  }));

  // ─── Request Logging ───
  const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
  app.use(morgan(morganFormat, {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }));

  // ─── Request Timeout Middleware (30s) ───
  app.use((req, res, next) => {
    req.setTimeout(30000, () => {
      logger.warn(`Request timeout: ${req.method} ${req.originalUrl}`);
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Request timeout. Please try again.',
        });
      }
    });
    next();
  });

  // ─── Health Check Endpoint ───
  app.get('/api/health', (req, res) => {
    const mongoose = require('mongoose');
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      worker: process.pid,
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
      },
    });
  });

  // ─── Root Route ───
  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "Smart Health Record Backend is running ✅",
      version: "1.0.0",
      docs: "/api/health",
    });
  });

  // ─── Connect to MongoDB ───
  connectDB();

  // ─── Ensure uploads directory exists ───
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads', { recursive: true });
  }

  // ─── Static File Serving ───
  app.use('/uploads/chat', express.static('uploads/chat'));

  // ─── API Routes with Rate Limiting ───
  app.use('/api/auth', authLimiter, authRouter);
  app.use('/api/medical-records', apiLimiter, medicalRecordsRouter);
  app.use('/api/doctor', apiLimiter, doctorRouter);
  app.use('/api/patient', apiLimiter, patientRouter);
  app.use('/api/profile', apiLimiter, profileRouter);
  app.use('/api/appointment', apiLimiter, appointmentRouter);
  app.use('/api/ai', apiLimiter, aiRouter);
  app.use('/api/chat', apiLimiter, chatRoutes);

  // ─── 404 Handler ───
  app.use((req, res, next) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found`,
    });
  });

  // ─── Global Error Handler (must be last middleware) ───
  app.use(errorHandler);

  // ─── Socket.io Logic with Error Handling ───
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join a room for doctor-patient chat
    socket.on('joinRoom', (room) => {
      if (!room || typeof room !== 'string') {
        socket.emit('error', { message: 'Invalid room name' });
        return;
      }
      socket.join(room);
      logger.debug(`Socket ${socket.id} joined room: ${room}`);
    });

    // Listen for new messages
    socket.on('chatMessage', async (data) => {
      try {
        if (!data || !data.room || !data.sender) {
          socket.emit('error', { message: 'Invalid message data' });
          return;
        }
        const chatMsg = new Chat({
          room: data.room,
          sender: data.sender,
          message: data.message,
        });
        await chatMsg.save();
        io.to(data.room).emit('chatMessage', chatMsg);
      } catch (err) {
        logger.error('Chat message error:', { error: err.message });
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Listen for file messages
    socket.on('fileMessage', async (data) => {
      try {
        if (!data || !data.room || !data.sender) {
          socket.emit('error', { message: 'Invalid file message data' });
          return;
        }
        const fileMsg = new Chat({
          room: data.room,
          sender: data.sender,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
        });
        await fileMsg.save();
        io.to(data.room).emit('fileMessage', fileMsg);
      } catch (err) {
        logger.error('File message error:', { error: err.message });
        socket.emit('error', { message: 'Failed to send file' });
      }
    });

    socket.on('disconnect', (reason) => {
      logger.debug(`Socket disconnected: ${socket.id} (${reason})`);
    });

    socket.on('error', (err) => {
      logger.error(`Socket error: ${socket.id}`, { error: err.message });
    });
  });

  // ─── Start Server ───
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    logger.info(`🚀 Worker ${process.pid} running on port ${PORT}`);
  });

  // ─── Graceful Shutdown ───
  const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async () => {
      logger.info('HTTP server closed');

      // Close Socket.io connections
      io.close(() => {
        logger.info('Socket.io connections closed');
      });

      // Close MongoDB connection
      await disconnectDB();

      logger.info('Graceful shutdown complete');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after 10s timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // ─── Unhandled Error Handlers ───
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', { error: reason?.message || reason });
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', { error: err.message, stack: err.stack });
    // Give logger time to flush before exit
    setTimeout(() => process.exit(1), 1000);
  });
}
