const mongoose = require("mongoose")
const generate = require("../helpers/generate")
const userSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  password: String,
  googleId: String,
  authType: {
    type: String,
    default: "local"
  },
  status: {
    type: String,
    default: "active"
  },
  phone: String,
  avatar: String,
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
}, {
  timestamps: true
});
const User = mongoose.model('User', userSchema, 'users')
module.exports = User