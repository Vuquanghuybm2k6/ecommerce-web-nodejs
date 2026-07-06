module.exports.requireAuth = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      code: 401,
      message: "Vui lòng đăng nhập để thực hiện chức năng này"
    })
  }
  next()
}
