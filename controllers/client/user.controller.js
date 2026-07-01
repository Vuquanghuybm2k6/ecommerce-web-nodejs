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
const setAuthCookies = clientAuthHelper.setAuthCookies
const getAuthenticatedUser = clientAuthHelper.getAuthenticatedUser

// [GET]: /user/register
module.exports.register = (req, res) => {
  res.render("client/pages/user/register", {
    pageTitle: "Đăng kí tài khoản",
  })
}

// [POST]: /user/register
module.exports.registerPost = async (req, res) => {
  const emailExit = await User.findOne({ email: req.body.email, deleted: false })
  if (emailExit) {
    req.flash("error", "Email này đã tồn tại")
    return res.redirect(req.get("Referer"))
  }

  req.body.password = bcrypt.hashSync(req.body.password, 10)
  const user = new User(req.body)
  await user.save()
  const tokens = await createTokenPair(user, req)
  setAuthCookies(res, tokens)
  req.flash("success", "Đăng kí tài khoản thành công")
  res.redirect("/")
}

// [GET]: /user/login
module.exports.login = (req, res) => {
  res.render("client/pages/user/login", {
    pageTitle: "Đăng nhập tài khoản",
  })
}

// [POST]: /user/login
module.exports.loginPost = async (req, res) => {
  const email = req.body.email
  const password = req.body.password
  const user = await User.findOne({ email: email, deleted: false })
  if (!user) {
    req.flash("error", "Email không tồn tại")
    return res.redirect(req.get("Referer"))
  }
  if (user.status == "inactive") {
    req.flash("error", "Tài khoản hiện đang bị khóa")
    return res.redirect(req.get("Referer"))
  }

  if (!bcrypt.compareSync(password, user.password)) {
    req.flash("error", "Sai mật khẩu")
    return res.redirect(req.get("Referer"))
  }

  const tokens = await createTokenPair(user, req)
  setAuthCookies(res, tokens)

  await Cart.updateOne({ _id: req.cookies.cart }, { user_id: user.id })
  res.redirect("/")
}

// [POST]: /user/refresh-token
module.exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token không tồn tại" })
  }

  try {
    const payload = jwtHelper.verifyRefreshToken(refreshToken)
    const tokenRecord = await RefreshToken.findOne({ token: refreshToken, revoked: false })
    if (!tokenRecord) {
      return res.status(401).json({ message: "Refresh token không hợp lệ" })
    }

    const user = await User.findOne({ _id: payload.id, deleted: false })
    if (!user) {
      return res.status(401).json({ message: "Người dùng không hợp lệ" })
    }

    await RefreshToken.updateOne({ _id: tokenRecord._id }, {
      revoked: true,
      revokedAt: Date.now()
    })

    const tokens = await createTokenPair(user, req)
    setAuthCookies(res, tokens)
    return res.json({ message: "Refresh token thành công" })
  } catch (error) {
    return res.status(401).json({ message: "Phiên đã hết hạn. Vui lòng đăng nhập lại" })
  }
}

// [GET]: /user/logout
module.exports.logout = async (req, res) => {

  if (req.cookies.refreshToken) {
    await RefreshToken.updateOne({ token: req.cookies.refreshToken }, {
      revoked: true,
      revokedAt: Date.now()
    })
  }

  res.clearCookie("accessToken")
  res.clearCookie("refreshToken")
  res.clearCookie("cartId")
  res.redirect("/")
}

// [GET]: /user/password/forgot
module.exports.forgotPassword = (req, res) => {
  res.render("client/pages/user/forgot-password", {
    pageTitle: "Lấy lại mật khẩu"
  }
  )
}

// [POST]: /user/password/forgot
module.exports.forgotPasswordPost = async (req, res) => {
  const email = req.body.email
  const user = await User.findOne({
    email: email,
    deleted: false
  })
  if (!user) {
    req.flash("error", "Email không tồn tại")
    return res.redirect(req.get("Referer"))
  }
  // Tạo ra mã otp, và lưu nó vào trong db 
  await ForgotPassword.deleteMany({ email }) // chặn việc người dùng gửi email nhiều lần, khi đó sẽ tạo ra nhiều otp rác
  const otp = generateHelper.generateRandomNumber(6)
  const objectForgotPassword = {
    email: email,
    otp: otp,
    expiresAt: Date.now()
  }
  const forgotPassword = new ForgotPassword(objectForgotPassword)
  await forgotPassword.save()
  // Gửi mã otp đó qua email của người dùng
  const subject = `Mã OTP xác mình lấy lại mật khẩu`
  const html = `Mã OTP xác mình lấy lại mật khẩu là <b>${otp}</b>. Thời hạn sử dụng là 3 phút. Lưu ý không được để lộ mã OTP`
  sendMailHelper.sendMail(email, subject, html)
  res.redirect(`/user/password/otp?email=${email}`)
}

// [GET]: /user/password/otp
module.exports.otpPassword = async (req, res) => {
  const email = req.query.email
  res.render("client/pages/user/otp-password", {
    pageTitle: "Nhập mã otp",
    email: email
  }
  )
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
    req.flash("error", "OTP không đúng")
    return res.redirect(req.get("Referer"))
  }
  const user = await User.findOne({
    email: email,
    deleted: false
  })
  const tokens = await createTokenPair(user, req)
  setAuthCookies(res, tokens)
  res.redirect(`/user/password/reset`)
}

// [GET]: /user/password/reset
module.exports.resetPassword = async (req, res) => {
  res.render("client/pages/user/reset-password", {
    pageTitle: "Đổi mật khẩu"
  }
  )
}

// [POST]: /user/password/reset
module.exports.resetPasswordPost = async (req, res) => {
  const password = req.body.password
  const authUser = await getAuthenticatedUser(req, res)
  if (!authUser) {
    return res.redirect("/user/login")
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
  req.flash("success", "Đổi mật khẩu thành công")
  res.redirect("/")
}

// [GET]: /user/info
module.exports.info = async (req, res) => {
  const authUser = await getAuthenticatedUser(req, res)
  if (!authUser) {
    return res.redirect("/user/login")
  }
  const user = await User.findOne({ _id: authUser.id }).select("-password")
  res.render("client/pages/user/info", {
    pageTitle: "Thông tin tài khoản",
    email: authUser.email,
    user: user
  }
  )
}

// [GET]: /user/edit
module.exports.edit = async (req, res) => {
  const authUser = await getAuthenticatedUser(req, res)
  if (!authUser) {
    return res.redirect("/user/login")
  }
  const user = await User.findOne({ _id: authUser.id }).select("-password")
  res.render("client/pages/user/edit", {
    pageTitle: "Chỉnh sửa tài khoản",
    user: user
  }
  )
}

// [PATCH]: /user/edit
module.exports.editPatch = async (req, res) => {
  const authUser = await getAuthenticatedUser(req, res)
  if (!authUser) {
    return res.redirect("/user/login")
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
    req.flash("error", `Email ${req.body.email} đã tồn tại`)
    return res.redirect(req.get("Referer"))
  } else {
    if (req.body.password) {
      req.body.password = bcrypt.hashSync(req.body.password, 10)
    } else {
      delete req.body.password
    }
    await User.updateOne({
      _id: user._id
    }, req.body)
    req.flash("success", "Cập nhật tài khoản thành công")
    return res.redirect(req.get("Referer"))
  }
}
