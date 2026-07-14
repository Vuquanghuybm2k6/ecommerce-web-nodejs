const Product = require("../models/product.model")
const Review = require("../models/review.model")

module.exports = async (productId) => {
  const result = await Review.aggregate([
    { $match: { product_id: productId, status: "approved" } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } }
  ])
  const data = result[0] || {}
  await Product.updateOne(
    { _id: productId },
    {
      $set: {
        ratingAvg: Math.round((data.avg || 0) * 10) / 10,
        ratingCount: data.count || 0
      }
    }
  )
}
