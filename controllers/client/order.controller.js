const orderService = require("../../services/order.service")
const { logger } = require("../../helpers/logger")
const httpError = require("../../helpers/httpError")

// [GET]: /api/orders
module.exports.index = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Thành công",
      data: await orderService.listOrdersByUser({ userId: req.user.id, query: req.query })
    })
  } catch (error) {
    logger.error('Lỗi lấy danh sách đơn hàng', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi lấy danh sách đơn hàng")
    res.status(statusCode).json(body)
  }
}

// [GET]: /api/orders/:orderId
module.exports.detail = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Thành công",
      data: await orderService.getOrderDetailByUser({
        orderId: req.params.orderId,
        userId: req.user.id
      })
    })
  } catch (error) {
    logger.error('Lỗi lấy chi tiết đơn hàng', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi lấy chi tiết đơn hàng")
    res.status(statusCode).json(body)
  }
}

// [PATCH]: /api/orders/cancel/:orderId
module.exports.cancel = async (req, res) => {
  try {
    await orderService.cancelByUser({
      orderId: req.params.orderId,
      userId: req.user.id
    })

    res.json({
      code: 200,
      message: "Hủy đơn hàng thành công"
    })
  } catch (error) {
    logger.error('Lỗi hủy đơn hàng', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Hủy đơn hàng thất bại")
    res.status(statusCode).json(body)
  }
}
