const passport = require("../../helpers/admin-oauth.helper")
const adminAuthHelper = require("../../helpers/admin-auth.helper")
const systemConfig = require("../../config/system")
const crypto = require('crypto')

const oauthCodeStore = new Map()

setInterval(() => {
  const now = Date.now()
  for (const [code, data] of oauthCodeStore) {
    if (data.expiresAt < now) oauthCodeStore.delete(code)
  }
}, 60000)

module.exports.googleAuth = passport.authenticate("admin-google", {
  scope: ["profile", "email"]
})

module.exports.googleCallback = (req, res, next) => {
  passport.authenticate("admin-google", { session: false }, async (err, account, info) => {
    if (err || !account) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/login?error=auth_failed`)
    }

    const tokens = await adminAuthHelper.createTokenPair(account, req)

    const code = crypto.randomBytes(16).toString('hex')
    oauthCodeStore.set(code, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + 60000
    })

    const url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/login?code=${code}`
    res.redirect(url)
  })(req, res, next)
}

module.exports.exchangeOAuthCode = async (req, res) => {
  const { code } = req.body
  const data = oauthCodeStore.get(code)
  if (!data || data.expiresAt < Date.now()) {
    oauthCodeStore.delete(code)
    return res.status(400).json({ code: 400, message: 'Code không hợp lệ hoặc đã hết hạn' })
  }
  oauthCodeStore.delete(code)
  res.json({
    code: 200,
    message: 'Thành công',
    data: { accessToken: data.accessToken, refreshToken: data.refreshToken }
  })
}
