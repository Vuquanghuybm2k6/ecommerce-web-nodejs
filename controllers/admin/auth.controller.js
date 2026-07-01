const Account = require("../../models/account.model")
const AdminRefreshToken = require("../../models/admin-refresh-token.model")
const systemConfig = require("../../config/system")
const md5 = require("md5")
const jwtHelper = require("../../helpers/jwt.helper")
const adminAuthHelper = require("../../helpers/admin-auth.helper")
// [GET]: /admin/auth/login
module.exports.login = async (req, res) => {
  if (req.cookies.adminAccessToken) {
    try {
      const payload = jwtHelper.verifyAccessToken(req.cookies.adminAccessToken)
      const user = await Account.findOne({
        _id: payload.id,
        deleted: false,
        status: "active"
      }).select("-password")
      if (user) {
        return res.redirect(`${systemConfig.prefixAdmin}/dashboard`)
      }
    } catch (err) {
      res.clearCookie("adminAccessToken")
      res.clearCookie("adminRefreshToken")
    }
  }
  res.render("admin/pages/auth/login", {
    pageTitle: "Trang đăng nhập"
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
    req.flash("error", "Email không tồn tại")
    res.redirect(req.get("Referer"))
    return
  } else {
    if (md5(password) != user.password) {
      req.flash("error", "Sai mật khẩu")
      res.redirect(req.get("Referer"))
      return
    } else {
      if (user.status == "inactive") {
        req.flash("error", "Tài khoản này hiện đang bị khóa")
        res.redirect(req.get("Referer"))
        return
      } else {
        const tokens = await adminAuthHelper.createTokenPair(user, req)
        adminAuthHelper.setAuthCookies(res, tokens)
        res.redirect(`${systemConfig.prefixAdmin}/dashboard`)
      }
    }
  }
}
// [POST]: /admin/auth/refresh-token
module.exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies.adminRefreshToken
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token không tồn tại" })
  }

  try {
    const payload = jwtHelper.verifyRefreshToken(refreshToken)
    const tokenRecord = await AdminRefreshToken.findOne({ token: refreshToken, revoked: false })
    if (!tokenRecord) {
      return res.status(401).json({ message: "Refresh token không hợp lệ" })
    }

    const user = await Account.findOne({ _id: payload.id, deleted: false, status: "active" })
    if (!user) {
      return res.status(401).json({ message: "Tài khoản không hợp lệ" })
    }

    await AdminRefreshToken.updateOne({ _id: tokenRecord._id }, {
      revoked: true,
      revokedAt: new Date()
    })

    const tokens = await adminAuthHelper.createTokenPair(user, req)
    adminAuthHelper.setAuthCookies(res, tokens)
    return res.json({ message: "Refresh token thành công" })
  } catch (error) {
    return res.status(401).json({ message: "Phiên đã hết hạn. Vui lòng đăng nhập lại" })
  }
}
// [GET]: /admin/auth/logout
module.exports.logout = async (req, res) => {
  if (req.cookies.adminRefreshToken) {
    await AdminRefreshToken.updateOne({ token: req.cookies.adminRefreshToken }, {
      revoked: true,
      revokedAt: new Date()
    })
  }
  res.clearCookie("adminAccessToken")
  res.clearCookie("adminRefreshToken")
  res.redirect(`${systemConfig.prefixAdmin}/auth/login`)
}