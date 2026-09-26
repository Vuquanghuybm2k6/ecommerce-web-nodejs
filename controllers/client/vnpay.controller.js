const paymentService = require("../../services/payment.service")
const { getClientIp } = require("../../helpers/vnpay")
const { logger } = require("../../helpers/logger")
const httpError = require("../../helpers/httpError")

// [GET]: /api/checkout/vnpay-return
// Redirect từ VNPay sau khi user hoàn tất thanh toán.
// Cập nhật paymentStatus trong DB như phương án dự phòng, vì IPN (server-to-server)
// chỉ chạy khi backend có URL công khai và được đăng ký ở cổng VNPay.
module.exports.vnpayReturn = async (req, res) => {
  try {
    res.redirect(await paymentService.getReturnRedirectUrl(req.query))
  } catch (error) {
    logger.error("VNPay return thất bại", { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Xử lý kết quả thanh toán thất bại")
    res.status(statusCode).json(body)
  }
}

// [GET]: /api/checkout/vnpay-ipn
// Hàm này có nhiệm vụ nhận kết quả thanh toán từ vnpay, ktra nó có hợp lệ hay k rồi cập nhật trạng thái đơn hàng.
// VNPay yêu cầu IPN luôn trả HTTP 200 kèm RspCode, nên lỗi ngoài dự kiến cũng trả RspCode 99.
module.exports.vnpayIpn = async (req, res) => {
  try {
    res.status(200).json(await paymentService.getIpnResult(req.query))
  } catch (error) {
    logger.error("VNPay IPN thất bại", { error: error.message, stack: error.stack })
    res.status(200).json({ RspCode: "99", Message: "Internal error" })
  }
}

// [POST]: /api/checkout/pay-again
// Tạo lại paymentUrl cho đơn VNPay chưa thanh toán thành công (trong vòng 24h)
module.exports.payAgain = async (req, res) => {
  try {
    res.status(200).json({
      code: 200,
      message: "Thành công",
      data: await paymentService.payAgain({
        orderId: req.body.orderId,
        userId: req.user.id,
        ipAddr: getClientIp(req)
      })
    })
  } catch (error) {
    logger.error('Tạo lại link thanh toán thất bại', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Tạo link thanh toán thất bại")
    res.status(statusCode).json(body)
  }
}
