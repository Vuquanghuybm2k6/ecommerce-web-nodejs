const passport = require("../../helpers/admin-oauth.helper")
const adminAuthHelper = require("../../helpers/admin-auth.helper")
const systemConfig = require("../../config/system")

module.exports.googleAuth = passport.authenticate("admin-google", {
  scope: ["profile", "email"]
})

module.exports.googleCallback = (req, res, next) => {
  passport.authenticate("admin-google", { session: false }, async (err, account, info) => {
    if (err || !account) {
      return res.status(401).json({
        code: 401,
        message: info?.message || "Đăng nhập Google thất bại"
      })
    }

    const tokens = await adminAuthHelper.createTokenPair(account, req)
    res.json({
      code: 200,
      message: "Đăng nhập thành công",
      data: tokens
    })
  })(req, res, next)
}
