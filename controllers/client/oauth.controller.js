const passport = require("../../helpers/oauth.helper")
const clientAuthHelper = require("../../helpers/auth.helper")

module.exports.googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"]
})

module.exports.googleCallback = (req, res, next) => {
  passport.authenticate("google", { session: false }, async (err, user) => {
    if (err || !user) {
      req.flash("error", "Đăng nhập Google thất bại")
      return res.redirect("/user/login")
    }

    const tokens = await clientAuthHelper.createTokenPair(user, req)
    clientAuthHelper.setAuthCookies(res, tokens)
    res.redirect("/")
  })(req, res, next)
}
