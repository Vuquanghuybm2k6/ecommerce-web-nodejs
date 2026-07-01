const systemConfig = require("../../config/system")
const Account = require("../../models/account.model")
const AdminRefreshToken = require("../../models/admin-refresh-token.model")
const Role = require("../../models/role.model")
const jwtHelper = require("../../helpers/jwt.helper")
const adminAuthHelper = require("../../helpers/admin-auth.helper")

module.exports.requireAuth = async (req, res, next) => {
  let account = null

  // 1. Verify access token
  const accessToken = req.cookies.adminAccessToken
  if (accessToken) {
    try {
      const payload = jwtHelper.verifyAccessToken(accessToken)
      account = await Account.findOne({
        _id: payload.id,
        deleted: false,
        status: "active"
      }).select("-password")
    } catch (err) {
      account = null
    }
  }

  // 2. Fallback: refresh token + auto refresh
  if (!account && req.cookies.adminRefreshToken) {
    try {
      const refreshToken = req.cookies.adminRefreshToken
      const payload = jwtHelper.verifyRefreshToken(refreshToken)
      const tokenRecord = await AdminRefreshToken.findOne({
        token: refreshToken,
        revoked: false
      })

      if (tokenRecord) {
        account = await Account.findOne({
          _id: payload.id,
          deleted: false,
          status: "active"
        }).select("-password")

        if (account) {
          const tokens = await adminAuthHelper.createTokenPair(account, req)
          adminAuthHelper.setAuthCookies(res, tokens)
        }
      }
    } catch (err) {
      account = null
    }
  }

  // 3. No valid session
  if (!account) {
    res.redirect(`${systemConfig.prefixAdmin}/auth/login`)
    return
  }

  const role = await Role.findOne({ _id: account.role_id }).select("title permissions")
  res.locals.user = account
  res.locals.role = role
  next()
}