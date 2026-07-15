const Account = require("../../models/account.model")
const AdminRefreshToken = require("../../models/admin-refresh-token.model")
const systemConfig = require("../../config/system")
const bcrypt = require("bcrypt")
const jwtHelper = require("../../helpers/jwt.helper")
const adminAuthHelper = require("../../helpers/admin-auth.helper")
const { logAction } = require("../../helpers/logger")

// [GET]: /admin/auth/login
module.exports.login = async (req, res) => {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1]
    try {
      const payload = jwtHelper.verifyAccessToken(token)
      const user = await Account.findOne({
        _id: payload.id,
        deleted: false,
        status: "active"
      }).select("-password")
      if (user) {
        return res.json({
          code: 200,
          message: "Đã đăng nhập",
          data: { user }
        })
      }
    } catch (err) {
      // Token invalid, continue
    }
  }
  res.json({
    code: 200,
    message: "Vui lòng đăng nhập"
  })
}

// [POST]: /admin/auth/login
module.exports.loginPost = async (req, res) => {
  const email = req.body.email
  const password = req.body.password
  const user = await Account.findOne({
    email: email,
    deleted: false
  })
  if (!user) {
    logAction('auth', 'admin_login_failed', `Admin login failed: email not found`, { email })
    return res.status(400).json({
      code: 400,
      message: "Email không tồn tại"
    })
  }
  if (user.status == "inactive") {
    logAction('auth', 'admin_login_failed', `Admin login failed: account inactive`, { email })
    return res.status(400).json({
      code: 400,
      message: "Tài khoản này hiện đang bị khóa"
    })
  }

  if (user.authType == "google") {
    logAction('auth', 'admin_login_failed', `Admin login failed: Google account`, { email })
    return res.status(400).json({
      code: 400,
      message: "Tài khoản này sử dụng Google để đăng nhập"
    })
  }

  if (!bcrypt.compareSync(password, user.password)) {
    logAction('auth', 'admin_login_failed', `Admin login failed: wrong password`, { email })
    return res.status(400).json({
      code: 400,
      message: "Sai mật khẩu"
    })
  }

  const tokens = await adminAuthHelper.createTokenPair(user, req)
  logAction('auth', 'admin_login_success', `Admin logged in: ${email}`, { accountId: user.id, email })
  res.json({
    code: 200,
    message: "Đăng nhập thành công",
    data: tokens
  })
}

// [POST]: /admin/auth/refresh-token
module.exports.refreshToken = async (req, res) => {
  const refreshToken = req.body.refreshToken
  if (!refreshToken) {
    return res.status(401).json({ code: 401, message: "Refresh token không tồn tại" })
  }

  try {
    const payload = jwtHelper.verifyRefreshToken(refreshToken)
    const tokenRecord = await AdminRefreshToken.findOne({ token: refreshToken, revoked: false })
    if (!tokenRecord) {
      logAction('auth', 'admin_refresh_failed', 'Admin refresh failed: invalid token')
      return res.status(401).json({ code: 401, message: "Refresh token không hợp lệ" })
    }

    const user = await Account.findOne({ _id: payload.id, deleted: false, status: "active" })
    if (!user) {
      logAction('auth', 'admin_refresh_failed', 'Admin refresh failed: account invalid', { accountId: payload.id })
      return res.status(401).json({ code: 401, message: "Tài khoản không hợp lệ" })
    }

    await AdminRefreshToken.updateOne({ _id: tokenRecord._id }, {
      revoked: true,
      revokedAt: new Date()
    })

    const tokens = await adminAuthHelper.createTokenPair(user, req)
    logAction('auth', 'admin_refresh_success', `Admin token refreshed`, { accountId: user.id, email: user.email })
    return res.json({ code: 200, message: "Refresh token thành công", data: tokens })
  } catch (error) {
    logAction('auth', 'admin_refresh_failed', 'Admin refresh failed: session expired')
    return res.status(401).json({ code: 401, message: "Phiên đã hết hạn. Vui lòng đăng nhập lại" })
  }
}

// [POST]: /admin/auth/logout
module.exports.logout = async (req, res) => {
  const refreshToken = req.body.refreshToken
  if (refreshToken) {
    await AdminRefreshToken.updateOne({ token: refreshToken }, {
      revoked: true,
      revokedAt: new Date()
    })
  }
  logAction('auth', 'admin_logout', 'Admin logged out', { accountId: req.user?.id })
  res.json({
    code: 200,
    message: "Đăng xuất thành công"
  })
}
