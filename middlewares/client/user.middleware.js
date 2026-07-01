const User = require("../../models/user.model")
const RefreshToken = require("../../models/refresh-token.model")
const jwtHelper = require("../../helpers/jwt.helper")
const clientAuthHelper = require("../../helpers/auth.helper")

module.exports.infoUser = async (req, res, next) => {
  let user = null
  // 1. Verify Access Token
  const accessToken = req.cookies.accessToken

  if (accessToken) {
    try {
      const payload = jwtHelper.verifyAccessToken(accessToken)

      user = await User.findOne({
        _id: payload.id,
        deleted: false
      }).select("-password")

    } catch (err) {
      // access token hết hạn / sai → bỏ qua
      user = null
    }
  }
  // 2. Chỉ check refresh token (KHÔNG ROTATE)
  if (!user && req.cookies.refreshToken) {
    try {
      const refreshToken = req.cookies.refreshToken

      const payload = jwtHelper.verifyRefreshToken(refreshToken)

      const tokenRecord = await RefreshToken.findOne({
        token: refreshToken,
        revoked: false
      })

      if (tokenRecord) {
        user = await User.findOne({
          _id: payload.id,
          deleted: false
        }).select("-password")

        if (user) {
          const tokens = await clientAuthHelper.createTokenPair(user, req)
          clientAuthHelper.setAuthCookies(res, tokens)
        }
      }

    } catch (err) {
      // refresh token sai / hết hạn
      user = null
    }
  }

  // 3. Gắn user vào locals
  if (user) {
    res.locals.user = user
  }

  next()
}