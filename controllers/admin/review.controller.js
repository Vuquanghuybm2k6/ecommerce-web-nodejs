const Review = require("../../models/review.model")
const Product = require("../../models/product.model")
const User = require("../../models/user.model")
const Notification = require("../../models/notification.model")
const paginationHelper = require("../../helpers/pagination")
const updateProductRating = require("../../helpers/updateProductRating")
const { sendMail } = require("../../helpers/sendMail")
const { logger } = require("../../helpers/logger")

// [GET] /api/admin/reviews
module.exports.index = async (req, res) => {
  try {
    let find = {}

    if (req.query.status) {
      find.status = req.query.status
    }

    const totalReviews = await Review.countDocuments(find)
    const pagination = paginationHelper(req.query, totalReviews, {
      currentPage: 1,
      limitItem: 10
    })

    const sort = {}
    if (req.query.sortKey && req.query.sortValue) {
      sort[req.query.sortKey] = req.query.sortValue
    } else {
      sort.createdAt = "desc"
    }

    const reviews = await Review.find(find)
      .limit(pagination.limitItem)
      .skip(pagination.skip)
      .sort(sort)
      .lean()

    const userIds = [...new Set(reviews.map(r => r.user_id))]
    const users = await User.find({ _id: { $in: userIds } })
      .select("fullName email")
      .lean()
    const userMap = {}
    users.forEach(u => { userMap[u._id.toString()] = u })

    const productIds = [...new Set(reviews.map(r => r.product_id))]
    const products = await Product.find({ _id: { $in: productIds } })
      .select("title slug")
      .lean()
    const productMap = {}
    products.forEach(p => { productMap[p._id.toString()] = p })

    const data = reviews.map(r => ({
      ...r,
      user: userMap[r.user_id] || null,
      product: productMap[r.product_id] || null
    }))

    const statusCounts = {}
    const counts = await Review.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } } // group theo status và đếm số lượng, dấu $ nghĩa là lấy giá trị của field đó
    ])
    counts.forEach(c => { statusCounts[c._id] = c.count })

    res.json({
      code: 200,
      message: "Thành công",
      data: {
        reviews: data,
        pagination,
        statusCounts
      }
    })
  } catch (error) {
    logger.error('Lỗi lấy danh sách đánh giá', { error: error.message, stack: error.stack })
    res.status(400).json({ code: 400, message: "Lỗi lấy danh sách đánh giá" })
  }
}

// [GET] /api/admin/reviews/:id
module.exports.detail = async (req, res) => {
  try {
    const id = req.params.id
    const review = await Review.findOne({ _id: id }).lean()

    if (!review) {
      return res.status(404).json({ code: 404, message: "Không tìm thấy đánh giá" })
    }

    const user = await User.findOne({ _id: review.user_id }).select("fullName email avatar").lean()
    const product = await Product.findOne({ _id: review.product_id }).select("title slug thumbnail").lean()

    review.user = user
    review.product = product

    res.json({
      code: 200,
      message: "Thành công",
      data: { review }
    })
  } catch (error) {
    logger.error('Lỗi lấy chi tiết đánh giá', { error: error.message, stack: error.stack })
    res.status(400).json({ code: 400, message: "Lỗi" })
  }
}

// [DELETE] /api/admin/reviews/:id
module.exports.deleteReview = async (req, res) => {
  try {
    const id = req.params.id
    const { reason } = req.body
    const adminId = req.user.id

    if (!reason || !reason.trim()) {
      return res.status(400).json({ code: 400, message: "Vui lòng nhập lý do xóa đánh giá" })
    }

    const review = await Review.findOne({ _id: id })

    if (!review) {
      return res.status(404).json({ code: 404, message: "Không tìm thấy đánh giá" })
    }

    if (review.status === "deleted") {
      return res.status(400).json({ code: 400, message: "Đánh giá này đã bị xóa trước đó" })
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

    res.json({
      code: 200,
      message: "Đã xóa đánh giá và gửi thông báo đến người dùng"
    })
  } catch (error) {
    logger.error('Lỗi xóa đánh giá', { error: error.message, stack: error.stack })
    res.status(400).json({ code: 400, message: "Lỗi xóa đánh giá" })
  }
}
