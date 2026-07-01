const passport = require("../../helpers/admin-oauth.helper")
const adminAuthHelper = require("../../helpers/admin-auth.helper")
const systemConfig = require("../../config/system")

module.exports.googleAuth = passport.authenticate("admin-google", {
  scope: ["profile", "email"]
})

module.exports.googleCallback = (req, res, next) => {
  passport.authenticate("admin-google", { session: false }, async (err, account, info) => {
    if (err || !account) {
      req.flash("error", info?.message || "Đăng nhập Google thất bại")
      return res.redirect(`${systemConfig.prefixAdmin}/auth/login`)
    }

    const tokens = await adminAuthHelper.createTokenPair(account, req)
    adminAuthHelper.setAuthCookies(res, tokens)
    res.redirect(`${systemConfig.prefixAdmin}/dashboard`)
  })(req, res, next)
}
