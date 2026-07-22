const passport = require("../../helpers/oauth.helper")
const clientAuthHelper = require("../../helpers/auth.helper")
const Cart = require("../../models/cart.model")
const crypto = require('crypto')

const oauthCodeStore = new Map()

setInterval(() => {
  const now = Date.now()
  for (const [code, data] of oauthCodeStore) {
    if (data.expiresAt < now) oauthCodeStore.delete(code)
  }
}, 60000)

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
      const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '')
      return res.redirect(`${baseUrl}/user/login?error=auth_failed`)
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
          const existing = userCart.products.find(p =>
            p.product_id.toString() === item.product_id.toString()
            && (p.variantSku || '') === (item.variantSku || '')
          )
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

    const code = crypto.randomBytes(16).toString('hex')
    oauthCodeStore.set(code, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + 300000
    })

    res.clearCookie('guestCartId')
    const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '')
    const url = `${baseUrl}/user/login?code=${code}&cartId=${finalCart._id}`
    res.redirect(url)
  })(req, res, next)
}

module.exports.exchangeOAuthCode = async (req, res) => {
  const { code } = req.body
  const data = oauthCodeStore.get(code)
  if (!data || data.expiresAt < Date.now()) {
    oauthCodeStore.delete(code)
    return res.status(400).json({ code: 400, message: 'Code không hợp lệ hoặc đã hết hạn' })
  }
  res.json({
    code: 200,
    message: 'Thành công',
    data: { accessToken: data.accessToken, refreshToken: data.refreshToken }
  })
}
