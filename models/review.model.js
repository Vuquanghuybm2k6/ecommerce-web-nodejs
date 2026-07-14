const mongoose = require("mongoose")
const reviewSchema = new mongoose.Schema({
  product_id: {
    type: String,
    required: true
  },
  user_id: {
    type: String,
    required: true
  },
  order_id: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  content: {
    type: String,
    default: ""
  },
  images: [String],
  status: {
    type: String,
    enum: ["approved", "reported", "hidden", "deleted"],
    default: "approved"
  },
  deletedReason: String,
  deletedAt: Date,
  deletedBy: String,
  editedAt: Date,
  helpful: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})
reviewSchema.index({ product_id: 1, user_id: 1 }, { unique: true })
reviewSchema.index({ product_id: 1, status: 1, createdAt: -1 }) // đánh index để tìm kiếm review theo product_id và status, sắp xếp theo createdAt giảm dần
const Review = mongoose.model("Review", reviewSchema, "reviews")
module.exports = Review
