const userService = require("../../services/user.service")
const { setRefreshTokenCookie } = require("../../helpers/auth.helper")
const { logger } = require("../../helpers/logger")
const httpError = require("../../helpers/httpError")

// Ưu tiên cart id gửi lên header nếu khác với cart mà cart middleware đã gán.
const resolveGuestCartId = (req) => {
  const headerCartId = req.headers['x-cart-id']
  if (headerCartId && headerCartId !== req.cartId?.toString()) {
    return headerCartId
  }
  return req.cartId
}

const requireAuth = (req, res) => {
  if (!req.user) {
    res.status(401).json({ code: 401, message: "Vui lòng đăng nhập" })
    return false
  }
  return true
}

// [GET]: /user/register
module.exports.register = (req, res) => {
  res.json({ code: 200, message: "Trang đăng kí" })
}

// [POST]: /user/register
module.exports.registerPost = async (req, res) => {
  try {
    const data = await userService.register({
      body: req.body,
      cartId: resolveGuestCartId(req),
      userAgent: req.get("User-Agent") || "",
      ip: req.ip
    })

    setRefreshTokenCookie(res, data.refreshToken)

    res.json({
      code: 200,
      message: "Đăng kí tài khoản thành công",
      data: {
        user: data.user,
        cartId: data.cartId,
        accessToken: data.accessToken
      }
    })
  } catch (error) {
    logger.error('Lỗi đăng kí tài khoản', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Đăng kí tài khoản thất bại")
    res.status(statusCode).json(body)
  }
}

// [GET]: /user/login
module.exports.login = (req, res) => {
  res.json({ code: 200, message: "Trang đăng nhập" })
}

// [POST]: /user/login
module.exports.loginPost = async (req, res) => {
  try {
    const data = await userService.login({
      email: req.body.email,
      password: req.body.password,
      cartId: resolveGuestCartId(req),
      userAgent: req.get("User-Agent") || "",
      ip: req.ip
    })

    setRefreshTokenCookie(res, data.refreshToken)

    res.json({
      code: 200,
      message: "Đăng nhập thành công",
      data: {
        user: data.user,
        cartId: data.cartId,
        accessToken: data.accessToken
      }
    })
  } catch (error) {
    logger.error('Lỗi đăng nhập', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Đăng nhập thất bại")
    res.status(statusCode).json(body)
  }
}

// [POST]: /user/refresh-token
module.exports.refreshToken = async (req, res) => {
  try {
    const data = await userService.refreshToken(req.cookies.refreshToken)

    setRefreshTokenCookie(res, data.refreshToken)

    res.json({
      code: 200,
      message: "Refresh token thành công",
      data: { accessToken: data.accessToken }
    })
  } catch (error) {
    logger.error('Lỗi refresh token', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Refresh token thất bại")
    res.status(statusCode).json(body)
  }
}

// [POST]: /user/logout
module.exports.logout = async (req, res) => {
  try {
    await userService.logout({ token: req.cookies.refreshToken, userId: req.user?.id })

    res.clearCookie('refreshToken', { path: '/api', secure: true, sameSite: 'none' })

    res.json({ code: 200, message: "Đăng xuất thành công" })
  } catch (error) {
    logger.error('Lỗi đăng xuất', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Đăng xuất thất bại")
    res.status(statusCode).json(body)
  }
}

// [GET]: /user/password/forgot
module.exports.forgotPassword = (req, res) => {
  res.json({ code: 200, message: "Trang lấy lại mật khẩu" })
}

// [POST]: /user/password/forgot
module.exports.forgotPasswordPost = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Mã OTP đã được gửi qua email",
      data: await userService.sendOtp(req.body.email)
    })
  } catch (error) {
    logger.error('Lỗi gửi OTP lấy lại mật khẩu', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Gửi OTP thất bại")
    res.status(statusCode).json(body)
  }
}

// [GET]: /user/password/otp
module.exports.otpPassword = (req, res) => {
  res.json({
    code: 200,
    message: "Trang nhập mã OTP",
    data: { email: req.query.email }
  })
}

// [POST]: /user/password/otp
module.exports.otpPasswordPost = async (req, res) => {
  try {
    const data = await userService.verifyOtp({
      email: req.body.email,
      otp: req.body.otp,
      userAgent: req.get("User-Agent") || "",
      ip: req.ip
    })

    setRefreshTokenCookie(res, data.refreshToken)

    res.json({
      code: 200,
      message: "Xác thực OTP thành công",
      data: { accessToken: data.accessToken }
    })
  } catch (error) {
    logger.error('Lỗi xác thực OTP', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Xác thực OTP thất bại")
    res.status(statusCode).json(body)
  }
}

// [GET]: /user/password/reset
module.exports.resetPassword = (req, res) => {
  res.json({ code: 200, message: "Trang đổi mật khẩu" })
}

// [POST]: /user/password/reset
module.exports.resetPasswordPost = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ code: 401, message: "Vui lòng đăng nhập" })
  }

  try {
    await userService.resetPassword({
      password: req.body.password,
      userId: req.user.id
    })

    res.json({ code: 200, message: "Đổi mật khẩu thành công" })
  } catch (error) {
    logger.error('Lỗi đổi mật khẩu', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Đổi mật khẩu thất bại")
    res.status(statusCode).json(body)
  }
}

// [GET]: /user/info
module.exports.info = async (req, res) => {
  if (!requireAuth(req, res)) return

  try {
    res.json({
      code: 200,
      message: "Thành công",
      data: await userService.getProfile(req.user.id)
    })
  } catch (error) {
    logger.error('Lỗi lấy thông tin tài khoản', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi lấy thông tin tài khoản")
    res.status(statusCode).json(body)
  }
}

// [GET]: /user/edit
module.exports.edit = async (req, res) => {
  if (!requireAuth(req, res)) return

  try {
    res.json({
      code: 200,
      message: "Thành công",
      data: await userService.getProfile(req.user.id)
    })
  } catch (error) {
    logger.error('Lỗi lấy thông tin tài khoản', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi lấy thông tin tài khoản")
    res.status(statusCode).json(body)
  }
}

// [PATCH]: /user/edit
module.exports.editPatch = async (req, res) => {
  if (!requireAuth(req, res)) return

  try {
    await userService.updateProfile({ userId: req.user.id, body: req.body })

    res.json({ code: 200, message: "Cập nhật tài khoản thành công" })
  } catch (error) {
    logger.error('Lỗi cập nhật tài khoản', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Cập nhật tài khoản thất bại")
    res.status(statusCode).json(body)
  }
}
