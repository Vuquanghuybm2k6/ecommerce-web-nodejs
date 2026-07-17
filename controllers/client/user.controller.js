const User = require("../../models/user.model")
const bcrypt = require("bcrypt")
const redis = require("../../config/redis")
const generateHelper = require("../../helpers/generate")
const sendMailHelper = require("../../helpers/sendMail")
const Cart = require("../../models/cart.model")
const jwtHelper = require("../../helpers/jwt.helper")
const RefreshToken = require("../../models/refresh-token.model")
const clientAuthHelper = require("../../helpers/auth.helper")
const { logAction } = require("../../helpers/logger")

const createTokenPair = clientAuthHelper.createTokenPair

// [GET]: /user/register
module.exports.register = (req, res) => {
  res.json({ code: 200, message: "Trang đăng kí" })
}

// [POST]: /user/register
module.exports.registerPost = async (req, res) => {
  const emailExit = await User.findOne({ email: req.body.email, deleted: false })
  if (emailExit) {
    return res.status(400).json({ code: 400, message: "Email này đã tồn tại" })
  }

  req.body.password = bcrypt.hashSync(req.body.password, 10)
  const user = new User(req.body)
  await user.save()
  const tokens = await createTokenPair(user, req)

  const guestCartId = req.cartId
  let cart = guestCartId ? await Cart.findById(guestCartId) : null

  if (cart) {
    cart.user_id = user.id
    await cart.save()
  } else {
    cart = new Cart({ products: [], user_id: user.id })
    await cart.save()
  }

  logAction('auth', 'register', `User registered: ${user.email}`, { userId: user.id, email: user.email })

  res.json({
    code: 200,
    message: "Đăng kí tài khoản thành công",
    data: {
      user: { id: user.id, email: user.email },
      cartId: cart.id,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }
  })
}

// [GET]: /user/login
module.exports.login = (req, res) => {
  res.json({ code: 200, message: "Trang đăng nhập" })
}

// [POST]: /user/login
module.exports.loginPost = async (req, res) => {
  const email = req.body.email
  const password = req.body.password
  const user = await User.findOne({ email: email, deleted: false })
  if (!user) {
    logAction('auth', 'login_failed', `Login failed: email not found`, { email })
    return res.status(401).json({ code: 401, message: "Email không tồn tại" })
  }
  if (user.status == "inactive") {
    logAction('auth', 'login_failed', `Login failed: account inactive`, { email })
    return res.status(401).json({ code: 401, message: "Tài khoản hiện đang bị khóa" })
  }

  if (user.authType == "google") {
    logAction('auth', 'login_failed', `Login failed: Google account`, { email })
    return res.status(401).json({ code: 401, message: "Tài khoản này sử dụng Google để đăng nhập" })
  }

  if (!bcrypt.compareSync(password, user.password)) {
    logAction('auth', 'login_failed', `Login failed: wrong password`, { email })
    return res.status(401).json({ code: 401, message: "Sai mật khẩu" })
  }

  const tokens = await createTokenPair(user, req)

  const guestCartId = req.cartId
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
  } else if (guestCart && !userCart) {
    guestCart.user_id = user.id
    finalCart = guestCart
    await guestCart.save()
  } else if (!guestCart && !userCart) {
    finalCart = new Cart({ products: [], user_id: user.id })
    await finalCart.save()
  }

  logAction('auth', 'login_success', `User logged in: ${email}`, { userId: user.id, email })
  res.json({
    code: 200,
    message: "Đăng nhập thành công",
    data: {
      user: { id: user.id, email: user.email },
      cartId: finalCart._id,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }
  })
}

// [POST]: /user/refresh-token
module.exports.refreshToken = async (req, res) => {
  const refreshToken = req.body.refreshToken
  if (!refreshToken) {
    return res.status(401).json({ code: 401, message: "Refresh token không tồn tại" })
  }

  try {
    const payload = jwtHelper.verifyRefreshToken(refreshToken)
    const tokenRecord = await RefreshToken.findOne({ token: refreshToken, revoked: false })
    if (!tokenRecord) {
      logAction('auth', 'refresh_failed', 'Refresh failed: invalid token')
      return res.status(401).json({ code: 401, message: "Refresh token không hợp lệ" })
    }

    const user = await User.findOne({ _id: payload.id, deleted: false })
    if (!user) {
      logAction('auth', 'refresh_failed', 'Refresh failed: user not found', { userId: payload.id })
      return res.status(401).json({ code: 401, message: "Người dùng không hợp lệ" })
    }

    await RefreshToken.updateOne({ _id: tokenRecord._id }, {
      revoked: true,
      revokedAt: Date.now()
    })

    const tokens = await createTokenPair(user, req)
    logAction('auth', 'refresh_success', `Token refreshed for user ${user.email}`, { userId: user.id, email: user.email })
    return res.json({
      code: 200,
      message: "Refresh token thành công",
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    })
  } catch (error) {
    logAction('auth', 'refresh_failed', 'Refresh failed: session expired')
    return res.status(401).json({ code: 401, message: "Phiên đã hết hạn. Vui lòng đăng nhập lại" })
  }
}

// [POST]: /user/logout
module.exports.logout = async (req, res) => {
  const refreshToken = req.body.refreshToken

  if (refreshToken) {
    await RefreshToken.updateOne({ token: refreshToken }, {
      revoked: true,
      revokedAt: Date.now()
    })
  }

  logAction('auth', 'logout', `User logged out`, { userId: req.user?.id })
  res.json({ code: 200, message: "Đăng xuất thành công" })
}

// [GET]: /user/password/forgot
module.exports.forgotPassword = (req, res) => {
  res.json({ code: 200, message: "Trang lấy lại mật khẩu" })
}

// [POST]: /user/password/forgot
module.exports.forgotPasswordPost = async (req, res) => {
  const email = req.body.email
  const user = await User.findOne({
    email: email,
    deleted: false
  })
  if (!user) {
    return res.status(400).json({ code: 400, message: "Email không tồn tại" })
  }
  const otp = generateHelper.generateRandomNumber(6)
  // Key: "otp:{email}", value: otp, TTL: 180 giây
  await redis.set(`otp:${email}`, otp, 'EX', 180)
  const subject = `Mã OTP xác mình lấy lại mật khẩu`
  const html = `Mã OTP xác mình lấy lại mật khẩu là <b>${otp}</b>. Thời hạn sử dụng là 3 phút. Lưu ý không được để lộ mã OTP`
  sendMailHelper.sendMail(email, subject, html)
  res.json({ code: 200, message: "Mã OTP đã được gửi qua email", data: { email: email } })
}

// [GET]: /user/password/otp
module.exports.otpPassword = async (req, res) => {
  const email = req.query.email
  res.json({ code: 200, message: "Trang nhập mã OTP", data: { email: email } })
}

// [POST]: /user/password/otp
module.exports.otpPasswordPost = async (req, res) => {
  const email = req.body.email
  const otp = req.body.otp
  const storedOtp = await redis.get(`otp:${email}`)
  if (!storedOtp || storedOtp !== otp) {
    return res.status(400).json({ code: 400, message: "OTP không đúng hoặc đã hết hạn" })
  }
  await redis.del(`otp:${email}`) // Xoá sau khi xác thực thành công
  const user = await User.findOne({
    email: email,
    deleted: false
  })
  const tokens = await createTokenPair(user, req)
  res.json({
    code: 200,
    message: "Xác thực OTP thành công",
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }
  })
}

// [GET]: /user/password/reset
module.exports.resetPassword = async (req, res) => {
  res.json({ code: 200, message: "Trang đổi mật khẩu" })
}

// [POST]: /user/password/reset
module.exports.resetPasswordPost = async (req, res) => {
  const password = req.body.password
  const authUser = req.user
  if (!authUser) {
    return res.status(401).json({ code: 401, message: "Vui lòng đăng nhập" })
  }
  await User.updateOne({
    _id: authUser.id
  }, {
    password: bcrypt.hashSync(password, 10)
  })
  await RefreshToken.updateMany({
    userId: authUser.id,
    revoked: false
  }, {
    revoked: true,
    revokedAt: new Date()
  })
  res.json({ code: 200, message: "Đổi mật khẩu thành công" })
}

// [GET]: /user/info
module.exports.info = async (req, res) => {
  const authUser = req.user
  if (!authUser) {
    return res.status(401).json({ code: 401, message: "Vui lòng đăng nhập" })
  }
  const user = await User.findOne({ _id: authUser.id }).select("-password")
  res.json({
    code: 200,
    message: "Thành công",
    data: { user: user }
  })
}

// [GET]: /user/edit
module.exports.edit = async (req, res) => {
  const authUser = req.user
  if (!authUser) {
    return res.status(401).json({ code: 401, message: "Vui lòng đăng nhập" })
  }
  const user = await User.findOne({ _id: authUser.id }).select("-password")
  res.json({
    code: 200,
    message: "Thành công",
    data: { user: user }
  })
}

// [PATCH]: /user/edit
module.exports.editPatch = async (req, res) => {
  const authUser = req.user
  if (!authUser) {
    return res.status(401).json({ code: 401, message: "Vui lòng đăng nhập" })
  }
  const user = authUser
  const emailExit = await User.findOne({
    _id: {
      $ne: user._id
    },
    email: req.body.email,
    deleted: false
  })
  if (emailExit) {
    return res.status(400).json({ code: 400, message: `Email ${req.body.email} đã tồn tại` })
  } else {
    if (req.body.password) {
      req.body.password = bcrypt.hashSync(req.body.password, 10)
    } else {
      delete req.body.password
    }
    await User.updateOne({
      _id: user._id
    }, req.body)
    res.json({ code: 200, message: "Cập nhật tài khoản thành công" })
  }
}
