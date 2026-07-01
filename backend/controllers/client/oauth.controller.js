const passport = require("../../helpers/oauth.helper")
const clientAuthHelper = require("../../helpers/auth.helper")

module.exports.googleAuth = passport.authenticate("google", { // gọi đến gg, và muốn xin những thông tin trong scope
  scope: ["profile", "email"]
})

module.exports.googleCallback = (req, res, next) => {
  passport.authenticate("google", { session: false }, async (err, user) => {
    if (err || !user) {
      return res.status(401).json({ code: 401, message: "Đăng nhập Google thất bại" })
    }

    const tokens = await clientAuthHelper.createTokenPair(user, req)
    res.json({ code: 200, message: "Đăng nhập thành công", data: tokens })
  })(req, res, next)
}
