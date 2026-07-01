const Account = require("../models/account.model")
const AdminRefreshToken = require("../models/admin-refresh-token.model")
const jwtHelper = require("./jwt.helper")

module.exports.createTokenPair = async (account, req) => {
  const payload = {
    id: account._id,
    email: account.email
  }

  await AdminRefreshToken.updateMany({
    accountId: account._id,
    userAgent: req.get("User-Agent"),
    revoked: false
  }, {
    revoked: true,
    revokedAt: new Date()
  })

  const accessToken = jwtHelper.signAccessToken(payload)
  const refreshToken = jwtHelper.signRefreshToken(payload)

  const refreshTokenModel = new AdminRefreshToken({
    accountId: account._id,
    token: refreshToken,
    userAgent: req.get("User-Agent") || "",
    ip: req.ip,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  })

  await refreshTokenModel.save()

  return { accessToken, refreshToken }
}

module.exports.setAuthCookies = (res, tokens) => {
  res.cookie("adminAccessToken", tokens.accessToken, {
    httpOnly: true,
    maxAge: 15 * 60 * 1000,
    sameSite: "lax"
  })

  res.cookie("adminRefreshToken", tokens.refreshToken, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "lax"
  })
}

module.exports.getAuthenticatedAdmin = async (req, res) => {
  if (res.locals.admin) {
    return res.locals.admin
  }

  if (req.cookies.adminAccessToken) {
    try {
      const payload = jwtHelper.verifyAccessToken(req.cookies.adminAccessToken)
      return await Account.findOne({ _id: payload.id, deleted: false }).select("-password")
    } catch (error) {
      return null
    }
  }

  return null
}
