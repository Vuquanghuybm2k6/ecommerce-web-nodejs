const mongoose = require('mongoose');
const User = require('../models/user.model');
const Account = require('../models/account.model');
const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const Review = require('../models/review.model');
const Notification = require('../models/notification.model');
const RefreshToken = require('../models/refresh-token.model');
const dbConfig = require('../config/database');

async function mergeUsers(dryRun = true) {
  try {
    await mongoose.connect(dbConfig.uri);
    console.log(`Connected to DB. DryRun: ${dryRun}`);

    const duplicates = await User.aggregate([
      {
        $group: {
          _id: { $toLower: "$email" },
          users: { $push: "$$ROOT" },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    console.log(`Found ${duplicates.length} duplicate email groups.`);

    for (const group of duplicates) {
      const email = group._id;
      const users = group.users;
      
      // Logic to pick the main user:
      // 1. Prefer user with password
      // 2. Prefer user with googleId
      // 3. Otherwise the first one
      let mainUser = users.find(u => u.password) || users.find(u => u.googleId) || users[0];
      const others = users.filter(u => u._id.toString() !== mainUser._id.toString());

      console.log(`\nMerging group [${email}]:`);
      console.log(`  Main User: ${mainUser._id}`);
      
      for (const other of others) {
        console.log(`  Merging ${other._id} -> ${mainUser._id}`);
        
        // Merge fields if main user is missing them
        if (!mainUser.googleId && other.googleId) mainUser.googleId = other.googleId;
        if (!mainUser.fullName && other.fullName) mainUser.fullName = other.fullName;
        if (!mainUser.avatar && other.avatar) mainUser.avatar = other.avatar;

        if (!dryRun) {
          // Update references
          await Order.updateMany({ userId: other._id }, { userId: mainUser._id });
          await Cart.updateMany({ userId: other._id }, { userId: mainUser._id });
          await Review.updateMany({ userId: other._id }, { userId: mainUser._id });
          await Notification.updateMany({ userId: other._id }, { userId: mainUser._id });
          await RefreshToken.updateMany({ userId: other._id }, { userId: mainUser._id });
          
          // Remove duplicate
          await User.deleteOne({ _id: other._id });
        }
      }
      if (!dryRun) await mainUser.save();
    }

    console.log('\nMerge process completed.');
  } catch (err) {
    console.error('Error during merge:', err);
  } finally {
    await mongoose.disconnect();
  }
}

const dryRun = process.argv.includes('--dry-run') || !process.argv.includes('--execute');
mergeUsers(dryRun).then(() => process.exit(0));
