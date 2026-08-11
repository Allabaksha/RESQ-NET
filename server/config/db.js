const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/resqnet';
    console.log(`Connecting to MongoDB at: ${connStr}...`);
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 5000 // fail fast if local db not running
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`MongoDB Connection Warning: ${error.message}`);
    console.warn(`Fallback: Applications can operate using memory fallback or Atlas MongoDB URI.`);
    return false;
  }
};

module.exports = connectDB;
