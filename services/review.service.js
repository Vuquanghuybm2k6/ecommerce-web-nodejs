const mongoose = require("mongoose")
const Review = require("../models/review.model")
const Order = require("../models/order.model")
const User = require("../models/user.model")
const Product = require("../models/product.model")
const Notification = require("../models/notification.model")
const paginationHelper = require("../helpers/pagination")
const updateProductRating = require("../helpers/updateProductRating")
const { sendMail } = require("../helpers/sendMail")
const httpError = require("../helpers/httpError")

const EDIT_DAYS_LIMIT = 15

const isWithinEditWindow = (orderCreatedAt) => {
  const now = new Date()
  const diffMs = now - new Date(orderCreatedAt)
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays <= EDIT_DAYS_LIMIT
}

const toObjectIdList = (ids) => ids.map(id => new mongoose.Types.ObjectId(id))

const buildMap = (docs) => {
  const map = {}
  docs.forEach(doc => { map[doc._id.toString()] = doc })
  return map
}

const getEditWindowError = (verb) =>
  httpError(400, `Đã quá ${EDIT_DAYS_LIMIT} ngày kể từ khi mua hàng, bạn không thể ${verb} đánh giá này`)

/* ============================================
   CLIENT
   ============================================ */

// Lấy review của sản phẩm, kèm thông tin user (fullName, avatar) và phân trang
const getProductReviews = async ({ productId, query }) => {
  const sort = query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 }
  const find = { product_id: productId, status: "approved" }

  const totalReviews = await Review.countDocuments(find)
  const pagination = paginationHelper(query, totalReviews, {
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
  const userMap = buildMap(users)

  const data = reviews.map(r => ({
    ...r, // thông tin review
    user: userMap[r.user_id] || null // thông tin user gồm có id, fullName, avatar
  }))

  return { reviews: data, pagination: pagination }
}

const createReview = async ({ userId, body }) => {
  const { product_id, order_id, rating, content, images } = body

  // Kiểm tra đơn hàng đã giao thành công và có chứa sản phẩm này
  const order = await Order.findOne({
    _id: order_id,
    user_id: userId,
    status: "delivered",
    "products.product_id": product_id
  })

  if (!order) {
    throw httpError(400, "Bạn chưa mua sản phẩm này hoặc đơn hàng chưa được giao")
  }

  // Kiểm tra đã review chưa
  const existing = await Review.findOne({ product_id, user_id: userId })
  if (existing) {
    throw httpError(400, "Bạn đã đánh giá sản phẩm này rồi")
  }

  const product = await Product.findById(product_id).select("title").lean()
  const review = new Review({
    product_id,
    user_id: userId,
    order_id,
    rating,
    content: content || "",
    images: images || [],
    product_title: product?.title || ""
  })

  await review.save()
  await updateProductRating(product_id)

  return { review: review }
}

const getMyReviews = async ({ userId, query }) => {
  const find = { user_id: userId }

  const totalReviews = await Review.countDocuments(find)
  const pagination = paginationHelper(query, totalReviews, {
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
  const productMap = buildMap(products)

  const orderIds = [...new Set(reviews.map(r => r.order_id))]
  const orders = await Order.find({ _id: { $in: orderIds } })
    .select("createdAt")
    .lean()
  const orderMap = buildMap(orders)

  const data = reviews.map(r => {
    const order = orderMap[r.order_id]
    return {
      ...r,
      product: productMap[r.product_id] || null,
      canEdit: order ? isWithinEditWindow(order.createdAt) : false
    }
  })

  return { reviews: data, pagination: pagination }
}

const getUserReviewState = async ({ userId, productId }) => {
  if (!productId) throw httpError(400, "Thiếu thông tin sản phẩm")

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

  return {
    canReview: deliveredOrders.length > 0 && !existingReview,
    canEdit: canEdit,
    existingReview: existingReview,
    orders: deliveredOrders
  }
}

const updateReview = async ({ userId, reviewId, body }) => {
  const review = await Review.findOne({ _id: reviewId, user_id: userId })
  if (!review) throw httpError(404, "Không tìm thấy đánh giá")

  const order = await Order.findOne({ _id: review.order_id }).select("createdAt")
  if (!order || !isWithinEditWindow(order.createdAt)) {
    throw getEditWindowError("sửa")
  }

  const updateData = {}
  if (body.rating !== undefined) updateData.rating = body.rating
  if (body.content !== undefined) updateData.content = body.content
  if (body.images !== undefined) updateData.images = body.images
  updateData.editedAt = new Date()

  await Review.updateOne({ _id: reviewId }, { $set: updateData })

  if (updateData.rating !== undefined) {
    await updateProductRating(review.product_id)
  }
}

const deleteReview = async ({ userId, reviewId }) => {
  const review = await Review.findOne({ _id: reviewId, user_id: userId })
  if (!review) throw httpError(404, "Không tìm thấy đánh giá")

  const order = await Order.findOne({ _id: review.order_id }).select("createdAt")
  if (!order || !isWithinEditWindow(order.createdAt)) {
    throw getEditWindowError("xóa")
  }

  await Review.deleteOne({ _id: reviewId })
  await updateProductRating(review.product_id)
}

const uploadReviewImages = async ({ images }) => {
  return { images: images || [] }
}

const markReviewHelpful = async (reviewId) => {
  const result = await Review.updateOne(
    { _id: reviewId },
    { $inc: { helpful: 1 } }
  )

  if (result.matchedCount === 0) {
    throw httpError(404, "Không tìm thấy đánh giá")
  }
}

/* ============================================
   ADMIN
   ============================================ */

const getAdminReviews = async (query) => {
  const find = {}
  if (query.status) {
    find.status = query.status
  }

  const totalReviews = await Review.countDocuments(find)
  const pagination = paginationHelper(query, totalReviews, {
    currentPage: 1,
    limitItem: 10
  })

  const sort = {}
  if (query.sortKey && query.sortValue) {
    sort[query.sortKey] = query.sortValue
  } else {
    sort.createdAt = "desc"
  }

  const reviews = await Review.find(find)
    .limit(pagination.limitItem)
    .skip(pagination.skip)
    .sort(sort)
    .lean()

  const userIds = [...new Set(reviews.map(r => r.user_id))]
  const userMap = {}
  if (userIds.length) {
    const users = await User.find({ _id: { $in: toObjectIdList(userIds) } })
      .select("fullName email")
      .lean()
    users.forEach(u => { userMap[u._id.toString()] = u })
  }

  const productIds = [...new Set(reviews.map(r => r.product_id))]
  const productMap = {}
  if (productIds.length) {
    const products = await Product.find({ _id: { $in: toObjectIdList(productIds) } })
      .select("title slug")
      .lean()
    products.forEach(p => { productMap[p._id.toString()] = p })
  }

  const data = reviews.map(r => {
    const matchedProduct = productMap[r.product_id] || null
    return {
      ...r,
      user: userMap[r.user_id] || null,
      product: matchedProduct,
      product_title: matchedProduct?.title || r.product_title || null
    }
  })

  const statusCounts = {}
  const counts = await Review.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } } // group theo status và đếm số lượng, dấu $ nghĩa là lấy giá trị của field đó
  ])
  counts.forEach(c => { statusCounts[c._id] = c.count })

  return {
    reviews: data,
    pagination: pagination,
    statusCounts: statusCounts
  }
}

const getAdminReviewDetail = async (reviewId) => {
  const review = await Review.findOne({ _id: reviewId }).lean()
  if (!review) throw httpError(404, "Không tìm thấy đánh giá")

  const user = await User.findOne({ _id: review.user_id }).select("fullName email avatar").lean()
  const product = await Product.findOne({ _id: review.product_id }).select("title slug thumbnail").lean()

  review.user = user
  review.product = product
  review.product_title = product?.title || review.product_title || null

  return { review: review }
}

const adminDeleteReview = async ({ reviewId, reason, adminId }) => {
  if (!reason || !reason.trim()) {
    throw httpError(400, "Vui lòng nhập lý do xóa đánh giá")
  }

  const review = await Review.findOne({ _id: reviewId })
  if (!review) throw httpError(404, "Không tìm thấy đánh giá")

  if (review.status === "deleted") {
    throw httpError(400, "Đánh giá này đã bị xóa trước đó")
  }

  const user = await User.findOne({ _id: review.user_id })
  const product = await Product.findOne({ _id: review.product_id }).select("title")

  review.status = "deleted"
  review.deletedReason = reason.trim()
  review.deletedAt = new Date()
  review.deletedBy = adminId
  await review.save()
  await updateProductRating(review.product_id)

  const productName = product ? product.title : "sản phẩm"
  const notificationTitle = "Đánh giá của bạn đã bị xóa"
  const notificationMessage = `Đánh giá của bạn về "${productName}" đã bị xóa vì lý do: ${reason.trim()}`

  const notification = new Notification({
    user_id: review.user_id,
    type: "review_deleted",
    title: notificationTitle,
    message: notificationMessage,
    related_id: review._id.toString()
  })
  await notification.save()

  if (user && user.email) {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">Thông báo xóa đánh giá</h2>
        <p>Xin chào <strong>${user.fullName || "bạn"}</strong>,</p>
        <p>Đánh giá của bạn về sản phẩm <strong>"${productName}"</strong> đã bị ban quản trị xóa do vi phạm quy định.</p>
        <p><strong>Lý do:</strong> ${reason.trim()}</p>
        <p>Nếu bạn có thắc mắc, vui lòng liên hệ với chúng tôi để được giải đáp.</p>
        <br>
        <p>Trân trọng,<br>Ban quản trị</p>
      </div>
    `
    sendMail(user.email, notificationTitle, emailHtml)
  }
}

module.exports = {
  getProductReviews,
  createReview,
  getMyReviews,
  getUserReviewState,
  updateReview,
  deleteReview,
  uploadReviewImages,
  markReviewHelpful,
  getAdminReviews,
  getAdminReviewDetail,
  adminDeleteReview
}
