const systemConfig = require("../../config/system")
const Account = require("../../models/account.model")
const Role = require("../../models/role.model")
const jwtHelper = require("../../helpers/jwt.helper")

module.exports.requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ code: 401, message: "Unauthorized" })
  }

  const accessToken = authHeader.split(" ")[1]
  let account = null

  try {
    const payload = jwtHelper.verifyAccessToken(accessToken)
    account = await Account.findOne({
      _id: payload.id,
      deleted: false,
      status: "active"
    }).select("-password")
  } catch (err) {
    return res.status(401).json({ code: 401, message: "Unauthorized" })
  }

  if (!account) {
    return res.status(401).json({ code: 401, message: "Unauthorized" })
  }

  const role = await Role.findOne({ _id: account.role_id }).select("title permissions")
  req.user = account
  req.role = role
  next()
}
