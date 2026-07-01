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
  // No-op for API - controller handles sending tokens in response body
}

module.exports.getAccessTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return null
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  return parts[1]
}

module.exports.getAuthenticatedUser = async (req, res) => {
  if (req.user) {
    return req.user
  }

  const token = module.exports.getAccessTokenFromHeader(req)
  if (token) {
    try {
      const payload = jwtHelper.verifyAccessToken(token)
      return await User.findOne({ _id: payload.id, deleted: false }).select("-password")
    } catch (error) {
      return null
    }
  }

  return null
}
