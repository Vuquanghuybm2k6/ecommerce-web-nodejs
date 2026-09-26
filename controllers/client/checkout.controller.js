const checkoutService = require("../../services/checkout.service")
const { getClientIp } = require("../../helpers/vnpay")
const { logger } = require("../../helpers/logger")
const httpError = require("../../helpers/httpError")

// [GET]: /checkout
module.exports.index = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Thành công",
      data: await checkoutService.getCheckoutDetail(req.cartId)
    })
  } catch (error) {
    logger.error('Lỗi tải thông tin thanh toán', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi tải thông tin thanh toán")
    res.status(statusCode).json(body)
  }
}

// [POST]: /checkout/order
module.exports.order = async (req, res) => {
  try {
    const data = await checkoutService.createOrder({
      cartId: req.cartId,
      body: req.body,
      userId: req.user?.id,
      ipAddr: getClientIp(req)
    })

    res.status(200).json({
      code: 200,
      message: data.paymentMethod === 'vnpay' ? "Chuyển hướng thanh toán VNPay" : "Đặt hàng thành công",
      data: {
        orderId: data.orderId,
        orderCode: data.orderCode,
        paymentUrl: data.paymentUrl
      }
    })
  } catch (error) {
    logger.error('Đặt hàng thất bại', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Đặt hàng thất bại")
    res.status(statusCode).json(body)
  }
}

// [GET]: /checkout/success/:orderId
module.exports.success = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Thành công",
      data: await checkoutService.getOrderSuccessDetail(req.params.orderId)
    })
  } catch (error) {
    logger.error('Lỗi tải chi tiết đơn hàng', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi lấy chi tiết đơn hàng")
    res.status(statusCode).json(body)
  }
}
