const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas via Mongoose
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      console.warn('⚠️  MONGO_URI is not defined in environment variables. Database features will not work until configured.');
      return null;
    }

    const conn = await mongoose.connect(mongoUri, {
      autoIndex: true, // Build indexes in development
    });

    console.log(` MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // In production, failure to connect to database should terminate the process
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return null;
  }
};

/**
 * Disconnect from MongoDB (useful for test teardown and graceful shutdown)
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  } catch (error) {
    console.error(`Error closing MongoDB connection: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
