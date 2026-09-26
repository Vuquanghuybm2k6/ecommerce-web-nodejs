const orderService = require("../../services/order.service")
const { logger } = require("../../helpers/logger")
const httpError = require("../../helpers/httpError")

// [GET]: /admin/orders
module.exports.index = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Thành công",
      data: await orderService.listOrders(req.query)
    })
  } catch (error) {
    logger.error('Lỗi lấy danh sách đơn hàng', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi lấy danh sách đơn hàng")
    res.status(statusCode).json(body)
  }
}

// [GET]: /admin/orders/detail/:id
module.exports.detail = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Thành công",
      data: await orderService.getOrderDetail(req.params.id)
    })
  } catch (error) {
    logger.error('Lỗi lấy chi tiết đơn hàng', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi lấy chi tiết đơn hàng")
    res.status(statusCode).json(body)
  }
}

// [PATCH]: /admin/orders/change-status/:id
module.exports.changeStatus = async (req, res) => {
  try {
    await orderService.changeStatus({
      id: req.params.id,
      newStatus: req.body.status,
      reason: req.body.reason,
      adminId: req.user?.id
    })

    res.json({
      code: 200,
      message: "Cập nhật trạng thái thành công"
    })
  } catch (error) {
    logger.error('Lỗi cập nhật trạng thái đơn hàng', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Cập nhật trạng thái đơn hàng thất bại")
    res.status(statusCode).json(body)
  }
}

// [PATCH]: /admin/orders/delete/:id
module.exports.delete = async (req, res) => {
  try {
    await orderService.softDelete(req.params.id)

    res.json({
      code: 200,
      message: "Xóa đơn hàng thành công"
    })
  } catch (error) {
    logger.error('Lỗi xóa đơn hàng', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Xóa đơn hàng thất bại")
    res.status(statusCode).json(body)
  }
}
