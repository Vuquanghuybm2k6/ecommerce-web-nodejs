const User = require("../../models/user.model")
const jwtHelper = require("../../helpers/jwt.helper")

module.exports.infoUser = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null
    return next()
  }

  const accessToken = authHeader.split(" ")[1]
  let user = null

  try {
    const payload = jwtHelper.verifyAccessToken(accessToken)
    user = await User.findOne({
      _id: payload.id,
      deleted: false
    }).select("-password")
  } catch (err) {
    user = null
  }

  req.user = user
  next()
}
