const Cart = require("../../models/cart.model")
const Product = require("../../models/product.model")

module.exports.index = async (req, res, next) => {
  const cartId = req.body?.cartId || req.headers['x-cart-id']
  const cart = await Cart.findOne({_id: cartId})
  if(!cart || !cart.products || cart.products.length === 0){
    return res.status(400).json({ code: 400, message: "Giỏ hàng trống" })
  }
  next()
}

module.exports.order = async (req, res, next) => {
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
  const cartId = req.body?.cartId || req.headers['x-cart-id']
  const cart = await Cart.findOne({_id: cartId})
  if(!cart || !cart.products || cart.products.length === 0){
    return res.status(400).json({ code: 400, message: "Giỏ hàng trống" })
  }
  for(const product of cart.products){
    const productInfo = await Product.findOne({_id: product.product_id})
    if(!productInfo){
      return res.status(404).json({ code: 404, message: `Sản phẩm không tồn tại` })
    }
    if(!productInfo.stock || productInfo.stock < product.quantity){
      return res.status(400).json({
        code: 400,
        message: `Sản phẩm "${productInfo.title}" chỉ còn ${productInfo.stock || 0} sản phẩm trong kho`
      })
    }
  }
  next()
}
