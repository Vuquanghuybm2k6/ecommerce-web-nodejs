const mongoose = require("mongoose")
const notificationSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["review_deleted", "order_status_changed"],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  related_id: String,
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})
notificationSchema.index({ user_id: 1, createdAt: -1 })
notificationSchema.index({ user_id: 1, read: 1 })
const Notification = mongoose.model("Notification", notificationSchema, "notifications")
module.exports = Notification
