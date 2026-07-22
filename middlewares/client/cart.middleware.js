const Cart = require("../../models/cart.model")

module.exports.cartId = async (req, res, next) => {
  const cartId = req.headers['x-cart-id'] || req.body?.cartId
  let cart = null
  let userCart = null

  if (req.user && req.user.id) {
    userCart = await Cart.findOne({ user_id: req.user.id }).sort({ createdAt: -1 })
  }

  if (cartId) {
    cart = await Cart.findById(cartId)
  }

  if (req.user && req.user.id) {
    if (userCart) {
      if (cart && cart._id.toString() !== userCart._id.toString()) {
        for (const product of cart.products) {
          const existing = userCart.products.find(
            p => p.product_id.toString() === product.product_id.toString()
              && (p.variantSku || '') === (product.variantSku || '')
          )
          if (existing) {
            existing.quantity += product.quantity
          } else {
            userCart.products.push({
              product_id: product.product_id,
              quantity: product.quantity,
              variantSku: product.variantSku || '',
              variantLabel: product.variantLabel || '',
              variantOptions: product.variantOptions || [],
              thumbnail: product.thumbnail || '',
            })
          }
        }
        await Cart.deleteOne({ _id: cart._id })
        await userCart.save()
        await Cart.deleteMany({
          user_id: req.user.id,
          _id: { $ne: userCart._id }
        })
      }
      cart = userCart
    } else if (cart) {
      cart.user_id = req.user.id
      await cart.save()
    }
  } else if (!cart && userCart) {
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
  res.cookie('cartId', cart._id.toString(), { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: false, path: '/' })
  next()
}
