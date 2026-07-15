const { logger } = require("../../helpers/logger")

module.exports.requireAuth = async (req, res, next) => {
  if (!req.user) {
    logger.warn('User chưa đăng nhập', { url: req.originalUrl, method: req.method })
    return res.status(401).json({
      code: 401,
      message: "Vui lòng đăng nhập để thực hiện chức năng này"
    })
  }
  next()
}
