/**
 * Centralized Error Handling Middleware
 * 
 * Catches all errors from route handlers and returns
 * structured JSON responses. Handles specific error types
 * from Mongoose, JWT, and Multer.
 */

const logger = require('../config/logger');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle specific Mongoose errors
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const message = `Duplicate value for '${field}'. Please use another value.`;
  return new AppError(message, 409);
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((e) => e.message);
  const message = `Validation failed: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Token expired. Please log in again.', 401);

const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError('File too large. Maximum size is 10MB.', 400);
  }
  return new AppError(`File upload error: ${err.message}`, 400);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  let error = { ...err, message: err.message, stack: err.stack };

  // Log the error
  logger.error(`${err.message}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Handle specific error types
  if (err.name === 'CastError') error = handleCastError(err);
  if (err.code === 11000) error = handleDuplicateKeyError(err);
  if (err.name === 'ValidationError') error = handleValidationError(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
  if (err.name === 'MulterError') error = handleMulterError(err);

  const statusCode = error.statusCode || 500;
  const message = error.isOperational
    ? error.message
    : 'Internal server error. Please try again later.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

module.exports = { errorHandler, AppError };
