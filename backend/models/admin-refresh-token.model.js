const mongoose = require("mongoose")

const adminRefreshTokenSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true
  },
  token: {
    type: String,
    required: true
  },
  userAgent: String,
  ip: String,
  expiresAt: Date,
  revoked: {
    type: Boolean,
    default: false
  },
  revokedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const AdminRefreshToken = mongoose.model("AdminRefreshToken", adminRefreshTokenSchema, "adminRefreshTokens")
module.exports = AdminRefreshToken
