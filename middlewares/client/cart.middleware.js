const Cart = require("../../models/cart.model")

module.exports.cartId = async (req, res, next) => {
  const cartId = req.headers['x-cart-id'] || req.body?.cartId
  let cart = null
  let userCart = null

  if (req.user && req.user.id) {
    userCart = await Cart.findOne({ user_id: req.user.id })
  }

  if (cartId) {
    cart = await Cart.findById(cartId)
  }

  if (!cart) {
    cart = userCart
  }

  if (cart && userCart && cart._id.toString() !== userCart._id.toString()) {
    for (const product of cart.products) {
      const existing = userCart.products.find(
        p => p.product_id.toString() === product.product_id.toString()
      )
      if (existing) {
        existing.quantity += product.quantity
      } else {
        userCart.products.push({ product_id: product.product_id, quantity: product.quantity })
      }
    }
    await Cart.deleteOne({ _id: cart._id })
    await userCart.save()
    cart = userCart
  }

  if (!cart) {
    cart = new Cart({
      products: [],
      user_id: req.user?.id || ''
    })
    await cart.save()
  }

  if (req.user && req.user.id && !cart.user_id) {
    cart.user_id = req.user.id
    await cart.save()
  }

  req.cartId = cart._id
  req.miniCart = cart
  next()
}
