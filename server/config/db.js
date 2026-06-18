/**
 * MongoDB Connection Configuration
 * 
 * Features:
 * - Connection pooling (maxPoolSize)
 * - Retry logic with exponential backoff
 * - Connection event handlers
 * - Graceful disconnection
 */

const mongoose = require('mongoose');
const logger = require('./logger');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const connectDB = async () => {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        maxPoolSize: 10,        // Connection pool size
        minPoolSize: 2,         // Minimum connections maintained
        serverSelectionTimeoutMS: 5000, // Timeout after 5s
        socketTimeoutMS: 45000, // Close sockets after 45s inactivity
      });

      logger.info('✅ MongoDB connected successfully', {
        host: mongoose.connection.host,
        dbName: mongoose.connection.name,
      });

      // Connection event handlers
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', { error: err.message });
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Attempting to reconnect...');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected successfully');
      });

      return; // Successfully connected
    } catch (err) {
      retries++;
      logger.error(`❌ MongoDB connection attempt ${retries}/${MAX_RETRIES} failed:`, {
        error: err.message,
      });

      if (retries >= MAX_RETRIES) {
        logger.warn('⚠️ MongoDB connection failed after all retries. Server running without database.');
        logger.warn('API routes needing DB will return errors. Health check will show database: disconnected.');
        return; // Don't exit - server can still serve health checks and static routes
      }

      // Exponential backoff
      const delay = RETRY_DELAY_MS * Math.pow(2, retries - 1);
      logger.info(`Retrying in ${delay / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed gracefully');
  } catch (err) {
    logger.error('Error closing MongoDB connection:', { error: err.message });
  }
};

module.exports = { connectDB, disconnectDB };
