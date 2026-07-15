const Review = require("../../models/review.model")
const Order = require("../../models/order.model")
const User = require("../../models/user.model")
const Product = require("../../models/product.model")
const paginationHelper = require("../../helpers/pagination")
const updateProductRating = require("../../helpers/updateProductRating")
const { logger } = require("../../helpers/logger")

const EDIT_DAYS_LIMIT = 15

const isWithinEditWindow = (orderCreatedAt) => {
  const now = new Date()
  const diffMs = now - new Date(orderCreatedAt)
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays <= EDIT_DAYS_LIMIT
}

// [GET] /api/reviews/product/:productId
module.exports.index = async (req, res) => { // lấy ra các review của sản phẩm, kèm theo thông tin user (fullName, avatar) và phân trang
  try {
    const productId = req.params.productId
    const sort = req.query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 }

    const find = { product_id: productId, status: "approved" }

    const totalReviews = await Review.countDocuments(find)
    const pagination = paginationHelper(req.query, totalReviews, {
      currentPage: 1,
      limitItem: 10
    })
    pagination.totalItem = totalReviews

    const reviews = await Review.find(find)
      .limit(pagination.limitItem)
      .skip(pagination.skip)
      .sort(sort)
      .lean()

    const userIds = [...new Set(reviews.map(r => r.user_id))] // tránh các id bị lặp
    const users = await User.find({ _id: { $in: userIds } })
      .select("fullName avatar")
      .lean()
    const userMap = {}
    users.forEach(u => { userMap[u._id.toString()] = u }) // tạo bản đồ user_id => user

    const data = reviews.map(r => ({
      ...r, // thông tin review
      user: userMap[r.user_id] || null // thông tin user gồm có id, fullName, avatar
    }))

    res.json({
      code: 200,
      message: "Thành công",
      data: { reviews: data, pagination }
    })
  } catch (error) {
    logger.error('Lỗi lấy danh sách đánh giá', { error: error.message, stack: error.stack })
    res.status(400).json({ code: 400, message: "Lỗi lấy danh sách đánh giá" })
  }
}

// [POST] /api/reviews
module.exports.create = async (req, res) => {
  try {
    const userId = req.user.id
    const { product_id, order_id, rating, content, images } = req.body

    // Kiểm tra đơn hàng đã giao thành công và có chứa sản phẩm này
    const order = await Order.findOne({
      _id: order_id,
      user_id: userId,
      status: "delivered",
      "products.product_id": product_id
    })

    if (!order) {
      return res.status(400).json({
        code: 400,
        message: "Bạn chưa mua sản phẩm này hoặc đơn hàng chưa được giao"
      })
    }

    // Kiểm tra đã review chưa
    const existing = await Review.findOne({ product_id, user_id: userId })
    if (existing) {
      return res.status(400).json({
        code: 400,
        message: "Bạn đã đánh giá sản phẩm này rồi"
      })
    }

    const review = new Review({
      product_id,
      user_id: userId,
      order_id,
      rating,
      content: content || "",
      images: images || []
    })

    await review.save()
    await updateProductRating(product_id)

    res.json({
      code: 200,
      message: "Đánh giá thành công",
      data: { review }
    })
  } catch (error) {
    logger.error('Lỗi tạo đánh giá', { error: error.message, stack: error.stack })
    res.status(400).json({ code: 400, message: "Lỗi tạo đánh giá" })
  }
}

// [GET] /api/reviews/user
module.exports.myReviews = async (req, res) => {
  try {
    const userId = req.user.id

    const find = { user_id: userId }
    const totalReviews = await Review.countDocuments(find)
    const pagination = paginationHelper(req.query, totalReviews, {
      currentPage: 1,
      limitItem: 10
    })  
    pagination.totalItem = totalReviews

    const reviews = await Review.find(find)
      .limit(pagination.limitItem)
      .skip(pagination.skip)
      .sort({ createdAt: -1 })
      .lean()

    const productIds = [...new Set(reviews.map(r => r.product_id))]
    const products = await Product.find({ _id: { $in: productIds } })
      .select("title thumbnail slug")
      .lean()
    const productMap = {}
    products.forEach(p => { productMap[p._id.toString()] = p })

    const orderIds = [...new Set(reviews.map(r => r.order_id))]
    const orders = await Order.find({ _id: { $in: orderIds } })
      .select("createdAt")
      .lean()
    const orderMap = {}
    orders.forEach(o => { orderMap[o._id.toString()] = o })

    const data = reviews.map(r => {
      const order = orderMap[r.order_id]
      return {
        ...r,
        product: productMap[r.product_id] || null,
        canEdit: order ? isWithinEditWindow(order.createdAt) : false
      }
    })

    res.json({
      code: 200,
      message: "Thành công",
      data: { reviews: data, pagination }
    })
  } catch (error) {
    logger.error('Lỗi lấy danh sách đánh giá của tôi', { error: error.message, stack: error.stack })
    res.status(400).json({ code: 400, message: "Lỗi lấy danh sách đánh giá" })
  }
}

// [GET] /api/reviews/user-review?productId=
module.exports.userReview = async (req, res) => {
  try {
    const userId = req.user.id
    const productId = req.query.productId

    if (!productId) {
      return res.status(400).json({ code: 400, message: "Thiếu thông tin sản phẩm" })
    }

    const existingReview = await Review.findOne({ product_id: productId, user_id: userId }).lean()

    // Tìm đơn hàng đã giao có chứa sản phẩm này
    const deliveredOrders = await Order.find({
      user_id: userId,
      status: "delivered",
      "products.product_id": productId
    }).select("_id orderCode createdAt").lean()

    let canEdit = false
    if (existingReview && existingReview.order_id) {
      const reviewOrder = await Order.findOne({ _id: existingReview.order_id }).select("createdAt").lean()
      canEdit = reviewOrder ? isWithinEditWindow(reviewOrder.createdAt) : false
    }

    res.json({
      code: 200,
      message: "Thành công",
      data: {
        canReview: deliveredOrders.length > 0 && !existingReview,
        canEdit,
        existingReview,
        orders: deliveredOrders
      }
    })
  } catch (error) {
    logger.error('Lỗi kiểm tra đánh giá', { error: error.message, stack: error.stack })
    res.status(400).json({ code: 400, message: "Lỗi" })
  }
}

// [PATCH] /api/reviews/:id
module.exports.update = async (req, res) => {
  try {
    const userId = req.user.id
    const reviewId = req.params.id

    const review = await Review.findOne({ _id: reviewId, user_id: userId })
    if (!review) {
      return res.status(404).json({ code: 404, message: "Không tìm thấy đánh giá" })
    }

    const order = await Order.findOne({ _id: review.order_id }).select("createdAt")
    if (!order || !isWithinEditWindow(order.createdAt)) {
      return res.status(400).json({
        code: 400,
        message: `Đã quá ${EDIT_DAYS_LIMIT} ngày kể từ khi mua hàng, bạn không thể sửa đánh giá này`
      })
    }

    const updateData = {}
    if (req.body.rating !== undefined) updateData.rating = req.body.rating
    if (req.body.content !== undefined) updateData.content = req.body.content
    if (req.body.images !== undefined) updateData.images = req.body.images
    updateData.editedAt = new Date()

    await Review.updateOne({ _id: reviewId }, { $set: updateData })

    if (updateData.rating !== undefined) {
      await updateProductRating(review.product_id)
    }

    res.json({
      code: 200,
      message: "Cập nhật đánh giá thành công"
    })
  } catch (error) {
    logger.error('Lỗi cập nhật đánh giá', { error: error.message, stack: error.stack })
    res.status(400).json({ code: 400, message: "Lỗi cập nhật đánh giá" })
  }
}

// [DELETE] /api/reviews/:id
module.exports.delete = async (req, res) => {
  try {
    const userId = req.user.id
    const reviewId = req.params.id

    const review = await Review.findOne({ _id: reviewId, user_id: userId })
    if (!review) {
      return res.status(404).json({ code: 404, message: "Không tìm thấy đánh giá" })
    }

    const order = await Order.findOne({ _id: review.order_id }).select("createdAt")
    if (!order || !isWithinEditWindow(order.createdAt)) {
      return res.status(400).json({
        code: 400,
        message: `Đã quá ${EDIT_DAYS_LIMIT} ngày kể từ khi mua hàng, bạn không thể xóa đánh giá này`
      })
    }

    await Review.deleteOne({ _id: reviewId })
    await updateProductRating(review.product_id)

    res.json({
      code: 200,
      message: "Xóa đánh giá thành công"
    })
  } catch (error) {
    logger.error('Lỗi xóa đánh giá', { error: error.message, stack: error.stack })
    res.status(400).json({ code: 400, message: "Lỗi xóa đánh giá" })
  }
}

// [POST] /api/reviews/upload-images
module.exports.uploadImages = async (req, res) => {
  try {
    const images = req.body.images || []
    res.json({
      code: 200,
      message: "Upload ảnh thành công",
      data: { images }
    })
  } catch (error) {
    logger.error('Lỗi upload ảnh', { error: error.message, stack: error.stack })
    res.status(400).json({ code: 400, message: "Lỗi upload ảnh" })
  }
}

// [POST] /api/reviews/:id/helpful
module.exports.helpful = async (req, res) => {
  try {
    const reviewId = req.params.id

    const result = await Review.updateOne(
      { _id: reviewId },
      { $inc: { helpful: 1 } }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({ code: 404, message: "Không tìm thấy đánh giá" })
    }

    res.json({
      code: 200,
      message: "Cảm ơn bạn đã đánh giá hữu ích"
    })
  } catch (error) {
    logger.error('Lỗi helpful vote', { error: error.message, stack: error.stack })
    res.status(400).json({ code: 400, message: "Lỗi" })
  }
}
