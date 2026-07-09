const passport = require("../../helpers/oauth.helper")
const clientAuthHelper = require("../../helpers/auth.helper")
const Cart = require("../../models/cart.model")

module.exports.googleAuth = (req, res, next) => {
  const cartId = req.query.cartId || ''
  if (cartId) {
    res.cookie('guestCartId', cartId, { maxAge: 600000, httpOnly: true, sameSite: 'lax' })
  }
  passport.authenticate("google", {
    scope: ["profile", "email"]
  })(req, res, next)
}

module.exports.googleCallback = (req, res, next) => {
  passport.authenticate("google", { session: false }, async (err, user) => {
    if (err || !user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/user/login?error=auth_failed`)
    }

    const tokens = await clientAuthHelper.createTokenPair(user, req)

    const guestCartId = req.cookies?.guestCartId
    const [guestCart, userCart] = await Promise.all([
      guestCartId ? Cart.findById(guestCartId) : null,
      Cart.findOne({ user_id: user.id })
    ])

    let finalCart = userCart

    if (guestCart && userCart) {
      if (guestCart._id.toString() !== userCart._id.toString()) {
        for (const item of guestCart.products) {
          const existing = userCart.products.find(p => p.product_id === item.product_id)
          if (existing) {
            existing.quantity += item.quantity
          } else {
            userCart.products.push(item)
          }
        }
        await userCart.save()
        await Cart.deleteOne({ _id: guestCart._id })
      }
      finalCart = userCart
    } else if (guestCart && !userCart) {
      guestCart.user_id = user.id
      finalCart = guestCart
      await guestCart.save()
    } else if (!userCart) {
      finalCart = new Cart({ products: [], user_id: user.id })
      await finalCart.save()
    }

    res.clearCookie('guestCartId')
    const url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/user/login?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&cartId=${finalCart._id}`
    res.redirect(url)
  })(req, res, next)
}
