const Cart = require("../../models/cart.model")

module.exports.cartId = async (req, res, next) => {
  let cart = null

  //  Nếu client có cookie cartId → thử lấy cart trong DB
  if (req.cookies.cartId) {
    cart = await Cart.findById(req.cookies.cartId)
  }

  // Nếu KHÔNG có cart hoặc cart đã bị xóa
  if (!cart) {
    cart = new Cart({ products: [] })
    await cart.save()

    const expiresTime = 1000 * 60 * 60 * 24 * 365 // 1 năm
    res.cookie("cartId", cart._id, {
      expires: new Date(Date.now() + expiresTime)
    })
  }

  // Tính tổng số lượng sản phẩm trong giỏ
  cart.totalQuantity = cart.products.reduce(
    (sum, item) => sum + item.quantity,
    0
  )

  // Gán cho view (header dùng)
  res.locals.miniCart = cart

  next()
}
