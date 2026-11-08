require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { connectDB } = require('./config/db');
const apiRoutes = require('./routes/index');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security HTTP headers
app.use(helmet());

// Enable CORS for mobile clients (React Native) and web clients
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-timezone']
}));

// HTTP request logger (skip during automated tests)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Root health check route (for cloud load balancers and Render health checks)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Habit Tracker Service is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount API routes under /api
app.use('/api', apiRoutes);

// Catch-all 404 handler for undefined routes
app.use(notFound);

// Central error handling middleware
app.use(errorHandler);

// Start server if not imported by test suite
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Habit Tracker Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  });
}

module.exports = app;

