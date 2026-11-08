/**
 * Central Error Handler Middleware
 * Normalizes Mongoose, JWT, Validation, and HTTP errors into consistent responses:
 * { success: false, message: string, errors?: array }
 */

// Custom Application Error Class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 404 Route Not Found Middleware
const notFound = (req, res, next) => {
  const error = new AppError(`Resource not found - ${req.originalUrl}`, 404);
  next(error);
};

// Global Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || undefined;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for field '${err.path}': ${err.value}`;
  }

  // Handle Mongoose Duplicate Key Error (MongoDB error code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const duplicateFields = Object.keys(err.keyValue || {});
    const duplicateValues = Object.values(err.keyValue || {});
    message = duplicateFields.length
      ? `Duplicate value for '${duplicateFields.join(', ')}': ${duplicateValues.join(', ')}. Please use another value.`
      : 'Duplicate entry detected';
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message
    }));
    message = errors.map(e => e.message).join('. ');
  }

  // Handle JSON Syntax Error in request body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON payload in request body';
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token, authorization denied';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired, please log in again';
  }

  // Log unexpected internal errors in development
  if (statusCode === 500 && process.env.NODE_ENV !== 'test') {
    console.error('Unhandled Server Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  AppError,
  notFound,
  errorHandler
};

