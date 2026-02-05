const mongoose = require("mongoose")
const forgotPasswordSchema = new mongoose.Schema({
  email: String,
  otp: String,
  expiresAt: {
    type: Date,
    expires: 180 // sau 180 giây thì hết hiệu lực
  }
}, {
  timestamps: true
});
const ForgotPassword = mongoose.model('CarForgotPasswordt', forgotPasswordSchema, 'forgot-password')
module.exports = ForgotPassword