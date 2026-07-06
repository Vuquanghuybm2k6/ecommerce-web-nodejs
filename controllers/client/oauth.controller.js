const passport = require("../../helpers/oauth.helper")
const clientAuthHelper = require("../../helpers/auth.helper")

module.exports.googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"]
})

module.exports.googleCallback = (req, res, next) => {
  passport.authenticate("google", { session: false }, async (err, user) => {
    if (err || !user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/user/login?error=auth_failed`)
    }

    const tokens = await clientAuthHelper.createTokenPair(user, req)
    const url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/user/login?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`
    res.redirect(url)
  })(req, res, next)
}
