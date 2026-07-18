const Product = require("../../models/product.model")

const checkStock = (product, variantSku, quantity) => {
  let variant = null
  if (variantSku) {
    variant = product.variants.find(v => v.sku === variantSku)
    if (!variant || variant.status !== 'active') {
      return { ok: false, message: "Phiên bản sản phẩm không tồn tại" }
    }
  } else if (product.variants?.length) {
    return { ok: false, message: "Vui lòng chọn biến thể sản phẩm" }
  }
  if (variant) {
    if (!variant.stock || variant.stock < quantity) {
      return { ok: false, message: `Phiên bản "${variant.label}" chỉ còn ${variant.stock || 0} sản phẩm trong kho` }
    }
    return { ok: true, variant }
  }
  return { ok: true }
}

module.exports.addPost = async (req, res, next) => {
  const quantity = parseInt(req.body.quantity)
  if(!quantity || quantity <= 0){
    return res.status(400).json({ code: 400, message: "Số lượng phải lớn hơn 0" })
  }
  const product = await Product.findOne({_id: req.params.productId})
  if(!product){
    return res.status(404).json({ code: 404, message: "Sản phẩm không tồn tại" })
  }
  const variantSku = req.body.variantSku || ""
  const { ok, message } = checkStock(product, variantSku, quantity)
  if (!ok) return res.status(400).json({ code: 400, message })
  next()
}

module.exports.update = async (req, res, next) => {
  const quantity = parseInt(req.body.quantity)
  if(!quantity || quantity <= 0){
    return res.status(400).json({ code: 400, message: "Số lượng phải lớn hơn 0" })
  }
  const product = await Product.findOne({_id: req.params.productId})
  if(!product){
    return res.status(404).json({ code: 404, message: "Sản phẩm không tồn tại" })
  }
  const variantSku = req.body.variantSku || ""
  const { ok, message } = checkStock(product, variantSku, quantity)
  if (!ok) return res.status(400).json({ code: 400, message })
  next()
}
