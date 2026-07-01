const mongoose = require("mongoose")

const refreshTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema, "refreshTokens")
module.exports = RefreshToken
