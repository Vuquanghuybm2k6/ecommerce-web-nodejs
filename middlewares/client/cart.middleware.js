const Cart = require("../../models/cart.model")

module.exports.cartId = async (req, res, next) => {
  const cartId = req.headers['x-cart-id'] || req.body?.cartId
  let cart = null

  if (req.user && req.user.id) {
    cart = await Cart.findOne({ user_id: req.user.id })
  }

  if (!cart && cartId) {
    cart = await Cart.findById(cartId)
  }

  if (!cart) {
    cart = new Cart({
      products: [],
      user_id: req.user?.id || ''
    })
    await cart.save()
  }

  req.cartId = cart._id
  req.miniCart = cart
  next()
}
