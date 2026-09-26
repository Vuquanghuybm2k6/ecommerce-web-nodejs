const User = require("../models/user.model")
const RefreshToken = require("../models/refresh-token.model")
const jwtHelper = require("./jwt.helper")

const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000

const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/api',
  maxAge: REFRESH_TOKEN_MAX_AGE
}

// Cấp cặp access token + refresh token mà không phụ thuộc req/res,
// để service có thể dùng mà không cần chạm vào đối tượng express.
const issueTokenPair = async ({ user, userAgent = "", ip = "" }) => {
  const payload = {
    id: user._id,
    email: user.email
  }

  const accessToken = jwtHelper.signAccessToken(payload)
  const refreshToken = jwtHelper.signRefreshToken(payload)

  const refreshTokenModel = new RefreshToken({
    userId: user._id,
    token: refreshToken,
    userAgent: userAgent,
    ip: ip,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE)
  })

  await refreshTokenModel.save()

  return { accessToken, refreshToken }
}

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS)
}

module.exports.issueTokenPair = issueTokenPair
module.exports.setRefreshTokenCookie = setRefreshTokenCookie

module.exports.createTokenPair = async (user, req, res) => {
  const tokens = await issueTokenPair({
    user,
    userAgent: req.get("User-Agent") || "",
    ip: req.ip
  })

  setRefreshTokenCookie(res, tokens.refreshToken)

  return { accessToken: tokens.accessToken }
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
