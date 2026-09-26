const reviewService = require("../../services/review.service")
const { logger } = require("../../helpers/logger")
const httpError = require("../../helpers/httpError")

// [GET] /api/admin/reviews
module.exports.index = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Thành công",
      data: await reviewService.getAdminReviews(req.query)
    })
  } catch (error) {
    logger.error('Lỗi lấy danh sách đánh giá', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi lấy danh sách đánh giá")
    res.status(statusCode).json(body)
  }
}

// [GET] /api/admin/reviews/:id
module.exports.detail = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Thành công",
      data: await reviewService.getAdminReviewDetail(req.params.id)
    })
  } catch (error) {
    logger.error('Lỗi lấy chi tiết đánh giá', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi")
    res.status(statusCode).json(body)
  }
}

// [DELETE] /api/admin/reviews/:id
module.exports.deleteReview = async (req, res) => {
  try {
    await reviewService.adminDeleteReview({
      reviewId: req.params.id,
      reason: req.body.reason,
      adminId: req.user.id
    })

    res.json({
      code: 200,
      message: "Đã xóa đánh giá và gửi thông báo đến người dùng"
    })
  } catch (error) {
    logger.error('Lỗi xóa đánh giá', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi xóa đánh giá")
    res.status(statusCode).json(body)
  }
}
