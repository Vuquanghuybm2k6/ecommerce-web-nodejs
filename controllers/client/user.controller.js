const User = require("../../models/user.model")
const bcrypt = require("bcrypt")
const ForgotPassword = require("../../models/forgot-password.model")
const generateHelper = require("../../helpers/generate")
const sendMailHelper = require("../../helpers/sendMail")
const Cart = require("../../models/cart.model")
const jwtHelper = require("../../helpers/jwt.helper")
const RefreshToken = require("../../models/refresh-token.model")
const clientAuthHelper = require("../../helpers/auth.helper")

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

  const cart = new Cart({
    products: [],
    user_id: user.id
  })
  await cart.save()

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
    return res.status(401).json({ code: 401, message: "Email không tồn tại" })
  }
  if (user.status == "inactive") {
    return res.status(401).json({ code: 401, message: "Tài khoản hiện đang bị khóa" })
  }

  if (user.authType == "google") {
    return res.status(401).json({ code: 401, message: "Tài khoản này sử dụng Google để đăng nhập" })
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ code: 401, message: "Sai mật khẩu" })
  }

  const tokens = await createTokenPair(user, req)

  const cartId = req.cartId || req.body?.cartId || req.headers['x-cart-id']
  let cart = null

  if (cartId) {
    cart = await Cart.findById(cartId)
  }

  if (!cart) {
    cart = await Cart.findOne({ user_id: user.id })
  }

  if (!cart) {
    cart = new Cart({ products: [], user_id: user.id })
  }

  await Cart.updateOne({ _id: cart._id }, { user_id: user.id })

  res.json({
    code: 200,
    message: "Đăng nhập thành công",
    data: {
      user: { id: user.id, email: user.email },
      cartId: cart._id,
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
      return res.status(401).json({ code: 401, message: "Refresh token không hợp lệ" })
    }

    const user = await User.findOne({ _id: payload.id, deleted: false })
    if (!user) {
      return res.status(401).json({ code: 401, message: "Người dùng không hợp lệ" })
    }

    await RefreshToken.updateOne({ _id: tokenRecord._id }, {
      revoked: true,
      revokedAt: Date.now()
    })

    const tokens = await createTokenPair(user, req)
    return res.json({
      code: 200,
      message: "Refresh token thành công",
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    })
  } catch (error) {
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
  await ForgotPassword.deleteMany({ email })
  const otp = generateHelper.generateRandomNumber(6)
  const objectForgotPassword = {
    email: email,
    otp: otp,
    expiresAt: Date.now()
  }
  const forgotPassword = new ForgotPassword(objectForgotPassword)
  await forgotPassword.save()
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
  const result = await ForgotPassword.findOne({
    email: email,
    otp: otp
  })
  if (!result) {
    return res.status(400).json({ code: 400, message: "OTP không đúng" })
  }
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
