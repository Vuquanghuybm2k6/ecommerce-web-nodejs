const jwt = require("jsonwebtoken")
const generate = require("./generate")

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "access-secret-key"
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || "refresh-secret-key"

module.exports.signAccessToken = (payload) => {
  return jwt.sign(payload, accessTokenSecret, { expiresIn: "15m" })
}

module.exports.signRefreshToken = (payload) => {
  return jwt.sign(payload, refreshTokenSecret, { expiresIn: "7d" })
}

module.exports.verifyAccessToken = (token) => { // kiểm tra access token có hợp lệ hay không
  return jwt.verify(token, accessTokenSecret)
}
// jwt.verify(token, accessTokenSecret)
// jwt sẽ bị tách thành 3 phần header payload signature
//tạo lại signature từ header + payload + secret
//so sánh signature
// check expiration time
module.exports.verifyRefreshToken = (token) => {
  return jwt.verify(token, refreshTokenSecret)
}

module.exports.generateSessionId = () => {
  return generate.generateRandomString(20)
}
