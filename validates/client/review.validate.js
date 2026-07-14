module.exports.create = (req, res, next) => {
  const { rating, product_id, order_id } = req.body

  if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ code: 400, message: "Đánh giá phải từ 1 đến 5 sao" })
  }

  if (!product_id) {
    return res.status(400).json({ code: 400, message: "Thiếu thông tin sản phẩm" })
  }

  if (!order_id) {
    return res.status(400).json({ code: 400, message: "Thiếu thông tin đơn hàng" })
  }

  if (req.body.content && req.body.content.length > 2000) {
    return res.status(400).json({ code: 400, message: "Nội dung đánh giá tối đa 2000 ký tự" })
  }

  next()
}

module.exports.update = (req, res, next) => {
  if (req.body.rating !== undefined) {
    if (!Number.isInteger(req.body.rating) || req.body.rating < 1 || req.body.rating > 5) {
      return res.status(400).json({ code: 400, message: "Đánh giá phải từ 1 đến 5 sao" })
    }
  }

  if (req.body.content !== undefined && req.body.content.length > 2000) {
    return res.status(400).json({ code: 400, message: "Nội dung đánh giá tối đa 2000 ký tự" })
  }

  next()
}
