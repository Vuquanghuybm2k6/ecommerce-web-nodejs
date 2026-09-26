const cartService = require("../../services/cart.service")
const { logger } = require("../../helpers/logger")
const httpError = require("../../helpers/httpError")

// [GET]: /cart
module.exports.index = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Thành công",
      data: await cartService.getCartDetail(req.cartId)
    })
  } catch (error) {
    logger.error('Lỗi lấy giỏ hàng', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi lấy giỏ hàng")
    res.status(statusCode).json(body)
  }
}

// [POST]: /cart/add/:productId
module.exports.addPost = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Thêm sản phẩm vào giỏ hàng thành công",
      data: await cartService.addItem({
        cartId: req.cartId,
        productId: req.params.productId,
        quantity: parseInt(req.body.quantity),
        variantSku: req.body.variantSku || ""
      })
    })
  } catch (error) {
    logger.error('Lỗi thêm sản phẩm vào giỏ hàng', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Thêm sản phẩm vào giỏ hàng thất bại")
    res.status(statusCode).json(body)
  }
}

// [DELETE]: /cart/delete/:productId
module.exports.delete = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Đã xóa sản phẩm khỏi giỏ hàng!",
      data: await cartService.removeItem({
        cartId: req.cartId,
        productId: req.params.productId,
        variantSku: req.body.variantSku || ""
      })
    })
  } catch (error) {
    logger.error('Lỗi xóa sản phẩm khỏi giỏ hàng', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Xóa sản phẩm khỏi giỏ hàng thất bại")
    res.status(statusCode).json(body)
  }
}

// [PUT]: /cart/update/:productId
module.exports.update = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Đã cập nhật số lượng!",
      data: await cartService.updateItemQuantity({
        cartId: req.cartId,
        productId: req.params.productId,
        quantity: parseInt(req.body.quantity),
        variantSku: req.body.variantSku || ""
      })
    })
  } catch (error) {
    logger.error('Lỗi cập nhật số lượng giỏ hàng', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Cập nhật số lượng thất bại")
    res.status(statusCode).json(body)
  }
}
