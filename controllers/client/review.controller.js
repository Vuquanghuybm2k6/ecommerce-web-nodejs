const reviewService = require("../../services/review.service")
const { logger } = require("../../helpers/logger")
const httpError = require("../../helpers/httpError")

// [GET] /api/reviews/product/:productId
module.exports.index = async (req, res) => { // lấy ra các review của sản phẩm, kèm theo thông tin user (fullName, avatar) và phân trang
  try {
    res.json({
      code: 200,
      message: "Thành công",
      data: await reviewService.getProductReviews({
        productId: req.params.productId,
        query: req.query
      })
    })
  } catch (error) {
    logger.error('Lỗi lấy danh sách đánh giá', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi lấy danh sách đánh giá")
    res.status(statusCode).json(body)
  }
}

// [POST] /api/reviews
module.exports.create = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Đánh giá thành công",
      data: await reviewService.createReview({
        userId: req.user.id,
        body: req.body
      })
    })
  } catch (error) {
    logger.error('Lỗi tạo đánh giá', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi tạo đánh giá")
    res.status(statusCode).json(body)
  }
}

// [GET] /api/reviews/user
module.exports.myReviews = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Thành công",
      data: await reviewService.getMyReviews({
        userId: req.user.id,
        query: req.query
      })
    })
  } catch (error) {
    logger.error('Lỗi lấy danh sách đánh giá của tôi', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi lấy danh sách đánh giá")
    res.status(statusCode).json(body)
  }
}

// [GET] /api/reviews/user-review?productId=
module.exports.userReview = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Thành công",
      data: await reviewService.getUserReviewState({
        userId: req.user.id,
        productId: req.query.productId
      })
    })
  } catch (error) {
    logger.error('Lỗi kiểm tra đánh giá', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi")
    res.status(statusCode).json(body)
  }
}

// [PATCH] /api/reviews/:id
module.exports.update = async (req, res) => {
  try {
    await reviewService.updateReview({
      userId: req.user.id,
      reviewId: req.params.id,
      body: req.body
    })

    res.json({ code: 200, message: "Cập nhật đánh giá thành công" })
  } catch (error) {
    logger.error('Lỗi cập nhật đánh giá', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi cập nhật đánh giá")
    res.status(statusCode).json(body)
  }
}

// [DELETE] /api/reviews/:id
module.exports.delete = async (req, res) => {
  try {
    await reviewService.deleteReview({
      userId: req.user.id,
      reviewId: req.params.id
    })

    res.json({ code: 200, message: "Xóa đánh giá thành công" })
  } catch (error) {
    logger.error('Lỗi xóa đánh giá', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi xóa đánh giá")
    res.status(statusCode).json(body)
  }
}

// [POST] /api/reviews/upload-images
module.exports.uploadImages = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Upload ảnh thành công",
      data: await reviewService.uploadReviewImages({ images: req.body.images })
    })
  } catch (error) {
    logger.error('Lỗi upload ảnh', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi upload ảnh")
    res.status(statusCode).json(body)
  }
}

// [POST] /api/reviews/:id/helpful
module.exports.helpful = async (req, res) => {
  try {
    await reviewService.markReviewHelpful(req.params.id)

    res.json({ code: 200, message: "Cảm ơn bạn đã đánh giá hữu ích" })
  } catch (error) {
    logger.error('Lỗi helpful vote', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi")
    res.status(statusCode).json(body)
  }
}
