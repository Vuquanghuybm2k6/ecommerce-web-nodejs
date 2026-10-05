const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy
const User = require("../models/user.model")

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = (profile.emails?.[0]?.value || "").trim().toLowerCase()
    let user = await User.findOne({ googleId: profile.id, deleted: false })

    if (!user && email) {
      user = await User.findOne({ email, deleted: false })
      if (user) {
        user.googleId = profile.id
        user.fullName = user.fullName || profile.displayName
        user.avatar = user.avatar || profile.photos?.[0]?.value || ""
        await user.save()
      }
    }

    if (!user) {
      user = new User({
        fullName: profile.displayName,
        email: email,
        avatar: profile.photos?.[0]?.value || "",
        googleId: profile.id,
        authType: "google"
      })
      await user.save() 
    }

    return done(null, user)
  } catch (err) {
    return done(err, null)
  }
}))
module.exports = passport
