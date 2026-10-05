const User = require("../models/user.model")
const RefreshToken = require("../models/refresh-token.model")
const bcrypt = require("bcrypt")
const redis = require("../config/redis")
const httpError = require("../helpers/httpError")
const jwtHelper = require("../helpers/jwt.helper")
const generateHelper = require("../helpers/generate")
const sendMailHelper = require("../helpers/sendMail")
const { issueTokenPair } = require("../helpers/auth.helper")
const { mergeGuestCartIntoUser } = require("../helpers/cart")
const { logAction } = require("../helpers/logger")

const OTP_TTL_SECONDS = 180
const OTP_KEY_PREFIX = "otp:"

const register = async ({ body, cartId, userAgent, ip }) => {
  const normalizedEmail = body.email.trim().toLowerCase()
  const emailExit = await User.findOne({ email: normalizedEmail, deleted: false })
  if (emailExit) throw httpError(400, "Email này đã tồn tại")

  const user = new User({
    ...body,
    email: normalizedEmail,
    password: bcrypt.hashSync(body.password, 10)
  })
  await user.save()

  const tokens = await issueTokenPair({ user, userAgent, ip })
  const cart = await mergeGuestCartIntoUser({ guestCartId: cartId, userId: user.id })

  logAction('auth', 'register', `User registered: ${user.email}`, { userId: user.id, email: user.email })

  return {
    user: { id: user.id, email: user.email },
    cartId: cart._id,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken
  }
}

const login = async ({ email, password, cartId, userAgent, ip }) => {
  const normalizedEmail = email.trim().toLowerCase()
  const user = await User.findOne({ email: normalizedEmail, deleted: false })
  if (!user) {
    logAction('auth', 'login_failed', `Login failed: email not found`, { email: normalizedEmail })
    throw httpError(401, "Email không tồn tại")
  }

  if (user.status == "inactive") {
    logAction('auth', 'login_failed', `Login failed: account inactive`, { email: normalizedEmail })
    throw httpError(401, "Tài khoản hiện đang bị khóa")
  }

  if (!user.password) {
    logAction('auth', 'login_failed', `Login failed: Google-only account`, { email: normalizedEmail })
    throw httpError(401, "Tài khoản này sử dụng Google để đăng nhập")
  }

  if (!bcrypt.compareSync(password, user.password)) {
    logAction('auth', 'login_failed', `Login failed: wrong password`, { email: normalizedEmail })
    throw httpError(401, "Sai mật khẩu")
  }

  const tokens = await issueTokenPair({ user, userAgent, ip })
  const cart = await mergeGuestCartIntoUser({ guestCartId: cartId, userId: user.id })

  logAction('auth', 'login_success', `User logged in: ${email}`, { userId: user.id, email })

  return {
    user: { id: user.id, email: user.email },
    cartId: cart._id,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken
  }
}

const refreshToken = async (token) => {
  if (!token) throw httpError(401, "Refresh token không tồn tại")

  let payload
  try {
    payload = jwtHelper.verifyRefreshToken(token)
  } catch {
    logAction('auth', 'refresh_failed', 'Refresh failed: session expired')
    throw httpError(401, "Phiên đã hết hạn. Vui lòng đăng nhập lại")
  }

  const tokenRecord = await RefreshToken.findOne({ token: token, revoked: false })
  if (!tokenRecord) {
    logAction('auth', 'refresh_failed', 'Refresh failed: invalid token')
    throw httpError(401, "Refresh token không hợp lệ")
  }

  const user = await User.findOne({ _id: payload.id, deleted: false })
  if (!user) {
    logAction('auth', 'refresh_failed', 'Refresh failed: user not found', { userId: payload.id })
    throw httpError(401, "Người dùng không hợp lệ")
  }

  const tokens = await issueTokenPair({ user })

  logAction('auth', 'refresh_success', `Token refreshed for user ${user.email}`, { userId: user.id, email: user.email })

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken
  }
}

const logout = async ({ token, userId }) => {
  if (token) {
    await RefreshToken.updateOne({ token: token }, {
      revoked: true,
      revokedAt: Date.now()
    })
  }

  logAction('auth', 'logout', `User logged out`, { userId: userId })
}

const sendOtp = async (email) => {
  const user = await User.findOne({ email: email, deleted: false })
  if (!user) throw httpError(400, "Email không tồn tại")

  const otp = generateHelper.generateRandomNumber(6)
  // Key: "otp:{email}", value: otp, TTL: 180 giây
  await redis.set(`${OTP_KEY_PREFIX}${email}`, otp, 'EX', OTP_TTL_SECONDS)

  const subject = `Mã OTP xác mình lấy lại mật khẩu`
  const html = `Mã OTP xác mình lấy lại mật khẩu là <b>${otp}</b>. Thời hạn sử dụng là 3 phút. Lưu ý không được để lộ mã OTP`
  sendMailHelper.sendMail(email, subject, html)

  return { email: email }
}

const verifyOtp = async ({ email, otp, userAgent, ip }) => {
  const storedOtp = await redis.get(`${OTP_KEY_PREFIX}${email}`)
  if (!storedOtp || storedOtp !== otp) {
    throw httpError(400, "OTP không đúng hoặc đã hết hạn")
  }

  await redis.del(`${OTP_KEY_PREFIX}${email}`) // Xoá sau khi xác thực thành công

  const user = await User.findOne({ email: email, deleted: false })
  if (!user) throw httpError(400, "Email không tồn tại")

  const tokens = await issueTokenPair({ user, userAgent, ip })

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken
  }
}

const resetPassword = async ({ password, userId }) => {
  await User.updateOne(
    { _id: userId },
    { password: bcrypt.hashSync(password, 10) }
  )

  await RefreshToken.updateMany(
    { userId: userId, revoked: false },
    { revoked: true, revokedAt: new Date() }
  )
}

const getProfile = async (userId) => {
  const user = await User.findOne({ _id: userId }).select("-password")
  if (!user) throw httpError(404, "Không tìm thấy người dùng")

  return { user: user }
}

const updateProfile = async ({ userId, body }) => {
  const payload = { ...body }

  const emailExit = await User.findOne({
    _id: { $ne: userId },
    email: payload.email,
    deleted: false
  })

  if (emailExit) {
    throw httpError(400, `Email ${payload.email} đã tồn tại`)
  }

  if (payload.password) {
    payload.password = bcrypt.hashSync(payload.password, 10)
  } else {
    delete payload.password
  }

  await User.updateOne({ _id: userId }, payload)
}

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  sendOtp,
  verifyOtp,
  resetPassword,
  getProfile,
  updateProfile
}
