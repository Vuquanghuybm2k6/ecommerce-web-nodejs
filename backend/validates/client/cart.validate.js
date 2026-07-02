const Product = require("../../models/product.model")
const Cart = require("../../models/cart.model")

module.exports.addPost = async (req, res, next) => {
  const quantity = parseInt(req.body.quantity)
  if(!quantity || quantity <= 0){
    return res.status(400).json({ code: 400, message: "Số lượng phải lớn hơn 0" })
  }
  const product = await Product.findOne({_id: req.params.productId})
  if(!product){
    return res.status(404).json({ code: 404, message: "Sản phẩm không tồn tại" })
  }
  const cartId = req.body?.cartId || req.headers['x-cart-id']
  const cart = await Cart.findOne({_id: cartId})
  if(!cart){
    return res.status(400).json({ code: 400, message: "Giỏ hàng không tồn tại" })
  }
  const exitProductInCart = cart.products.find(item => item.product_id == req.params.productId)
  const currentQuantity = exitProductInCart ? exitProductInCart.quantity : 0
  const totalQuantity = currentQuantity + quantity
  if(!product.stock || product.stock < totalQuantity){
    return res.status(400).json({
      code: 400,
      message: `Sản phẩm "${product.title}" chỉ còn ${product.stock || 0} sản phẩm trong kho`
    })
  }
  next()
}

module.exports.update = async (req, res, next) => {
  const quantity = parseInt(req.params.quantity)
  if(!quantity || quantity <= 0){
    return res.status(400).json({ code: 400, message: "Số lượng phải lớn hơn 0" })
  }
  const product = await Product.findOne({_id: req.params.productId})
  if(!product){
    return res.status(404).json({ code: 404, message: "Sản phẩm không tồn tại" })
  }
  if(!product.stock || product.stock < quantity){
    return res.status(400).json({
      code: 400,
      message: `Sản phẩm "${product.title}" chỉ còn ${product.stock || 0} sản phẩm trong kho`
    })
  }
  next()
}
