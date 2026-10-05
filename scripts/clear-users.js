const mongoose = require('mongoose');
const User = require('../models/user.model');
const RefreshToken = require('../models/refresh-token.model');
require('dotenv').config({ path: 'backend/.env' }); // Load env vars from .env file

async function clearUsers() {
  try {
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
      throw new Error("MONGO_URL not found in environment variables");
    }
    await mongoose.connect(mongoUrl);
    console.log('Connected to DB. Cleaning user data...');

    // Delete refresh tokens first to avoid orphaned records
    const rtDeleted = await RefreshToken.deleteMany({});
    console.log(`Deleted ${rtDeleted.deletedCount} refresh tokens.`);

    // Delete all users
    const userDeleted = await User.deleteMany({});
    console.log(`Deleted ${userDeleted.deletedCount} users.`);

    console.log('User data cleared successfully. Admin accounts (accounts collection) were not touched.');
  } catch (err) {
    console.error('Error clearing users:', err);
  } finally {
    await mongoose.disconnect();
  }
}

clearUsers().then(() => process.exit(0));
