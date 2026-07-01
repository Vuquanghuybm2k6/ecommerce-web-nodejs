const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy
const Account = require("../models/account.model")

passport.use("admin-google", new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_ADMIN_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value || ""
    let account = await Account.findOne({ googleId: profile.id })

    if (!account) {
      account = await Account.findOne({ email, deleted: false })
      if (!account) {
        return done(null, false, { message: "Email không có quyền truy cập admin" })
      }
      account.googleId = profile.id
      account.authType = "google"
      account.fullName = account.fullName || profile.displayName
      account.avatar = account.avatar || profile.photos?.[0]?.value || ""
      await account.save()
    }

    return done(null, account)
  } catch (err) {
    return done(err, null)
  }
}))

module.exports = passport
