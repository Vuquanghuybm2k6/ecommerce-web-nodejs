const Cart = require("../../models/cart.model")

module.exports.cartId = async (req, res, next) => {
  let cart = null
  const cartId = req.headers['x-cart-id'] || req.body?.cartId

  if (cartId) {
    cart = await Cart.findById(cartId)
  }

  if (!cart) {
    cart = new Cart({ products: [] })
    await cart.save()
  }

  cart.totalQuantity = cart.products.reduce(
    (sum, item) => sum + item.quantity,
    0
  )

  req.cartId = cart._id
  req.miniCart = cart

  next()
}
