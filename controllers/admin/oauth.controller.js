const passport = require("../../helpers/admin-oauth.helper")
const adminAuthHelper = require("../../helpers/admin-auth.helper")
const systemConfig = require("../../config/system")

module.exports.googleAuth = passport.authenticate("admin-google", {
  scope: ["profile", "email"]
})

module.exports.googleCallback = (req, res, next) => {
  passport.authenticate("admin-google", { session: false }, async (err, account, info) => {
    if (err || !account) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/login?error=auth_failed`)
    }

    const tokens = await adminAuthHelper.createTokenPair(account, req)
    const url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/login?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`
    res.redirect(url)
  })(req, res, next)
}
