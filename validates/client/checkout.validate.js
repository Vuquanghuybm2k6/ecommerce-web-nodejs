const Product = require("../../models/product.model")

module.exports.index = async (req, res, next) => {
  if(!req.miniCart.products || req.miniCart.products.length === 0){
    return res.status(400).json({ code: 400, message: "Giỏ hàng trống" })
  }
  next()
}

module.exports.order = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ code: 401, message: "Vui lòng đăng nhập hoặc đăng ký để đặt hàng" })
  }
  if(!req.body.fullName){
    return res.status(400).json({ code: 400, message: "Vui lòng nhập họ tên" })
  }
  if(!req.body.phone){
    return res.status(400).json({ code: 400, message: "Vui lòng nhập số điện thoại" })
  }
  const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/
  if(!phoneRegex.test(req.body.phone)){
    return res.status(400).json({ code: 400, message: "Số điện thoại không hợp lệ" })
  }
  if(!req.body.address){
    return res.status(400).json({ code: 400, message: "Vui lòng nhập địa chỉ" })
  }
  if(!req.miniCart.products || req.miniCart.products.length === 0){
    return res.status(400).json({ code: 400, message: "Giỏ hàng trống" })
  }
  const productInfos = await Promise.all(
    req.miniCart.products.map(p => Product.findOne({_id: p.product_id}))
  )
  for(let i = 0; i < req.miniCart.products.length; i++){
    const productInfo = productInfos[i]
    if(!productInfo){
      return res.status(404).json({ code: 404, message: `Sản phẩm không tồn tại` })
    }
    const cartItem = req.miniCart.products[i]
    let variant = null
    if (cartItem.variantSku) {
      variant = productInfo.variants.find(v => v.sku === cartItem.variantSku)
    }
    if (!variant && productInfo.variants?.length) {
      variant = productInfo.variants[0]
    }
    if (variant && (!variant.stock || variant.stock < cartItem.quantity)) {
      return res.status(400).json({
        code: 400,
        message: `Phiên bản "${variant.label}" của sản phẩm "${productInfo.title}" chỉ còn ${variant.stock || 0} sản phẩm trong kho`
      })
    }
  }
  next()
}
