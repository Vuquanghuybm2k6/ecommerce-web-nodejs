const User = require("../models/user.model")
const RefreshToken = require("../models/refresh-token.model")
const jwtHelper = require("./jwt.helper")

module.exports.createTokenPair = async (user, req) => {
  const payload = {
    id: user._id,
    email: user.email
  }

  await RefreshToken.updateMany({
    userId: user._id,
    userAgent: req.get("User-Agent"),
    revoked: false
  }, {
    revoked: true,
    revokedAt: new Date()
  })

  const accessToken = jwtHelper.signAccessToken(payload)
  const refreshToken = jwtHelper.signRefreshToken(payload)

  const refreshTokenModel = new RefreshToken({
    userId: user._id,
    token: refreshToken,
    userAgent: req.get("User-Agent") || "",
    ip: req.ip,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  })

  await refreshTokenModel.save()

  return { accessToken, refreshToken }
}

module.exports.setAuthCookies = (res, tokens) => {
  res.cookie("accessToken", tokens.accessToken, {
    httpOnly: true,
    maxAge: 1 * 60 * 1000,
    sameSite: "lax"
  })

  res.cookie("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "lax"
  })
}

module.exports.getAuthenticatedUser = async (req, res) => {
  if (res.locals.user) {
    return res.locals.user
  }

  if (req.cookies.accessToken) {
    try {
      const payload = jwtHelper.verifyAccessToken(req.cookies.accessToken)
      return await User.findOne({ _id: payload.id, deleted: false }).select("-password")
    } catch (error) {
      return null
    }
  }

  return null
}
