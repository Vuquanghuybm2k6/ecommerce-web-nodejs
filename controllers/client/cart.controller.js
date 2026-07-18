const Cart = require("../../models/cart.model")
const Product = require("../../models/product.model")
const productHelper = require("../../helpers/product")

const enrichCartData = async (cart) => {
  if (!cart) return null

  const products = cart.products || []

  if (products.length > 0) {
    const productInfos = await Promise.all(
      products.map(item => Product.findOne({ _id: item.product_id }))
    )

    products.forEach((item, index) => {
      const productInfo = productInfos[index]
      const productData = productInfo ? productInfo.toObject() : {}
      let variant = null
      let itemPrice = 0
      let itemPriceNew = 0
      let discountPercentage = 0

      if (item.variantSku && productInfo) {
        variant = productInfo.variants.find(v => v.sku === item.variantSku)
      }
      if (variant) {
        itemPrice = variant.price || 0
        discountPercentage = variant.discountPercentage || 0
        itemPriceNew = Number((itemPrice - itemPrice * discountPercentage / 100).toFixed(0))
      }

      item.productInfo = {
        _id: productData._id,
        title: productData.title || 'Sản phẩm',
        thumbnail: item.thumbnail || variant?.thumbnail || '',
        slug: productData.slug || '',
        price: itemPrice,
        priceNew: itemPriceNew,
        discountPercentage,
        variantLabel: item.variantLabel || '',
        variantOptions: item.variantOptions || [],
      }
      item.totalPrice = itemPriceNew * (item.quantity || 1)
    })
  }

  cart.totalPrice = products.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
  return cart
}

module.exports.enrichCartData = enrichCartData

// [GET]: /cart
module.exports.index = async (req,res)=>{
  const cartId = req.cartId
  const cart = await Cart.findOne({_id: cartId}).lean()

  if(!cart){
    return res.json({
      code: 200,
      message: "Thành công",
      data: { cart: { _id: cartId, products: [], totalPrice: 0 } }
    })
  }

  const enrichedCart = await enrichCartData(cart)
  res.json({
    code: 200,
    message: "Thành công",
    data: { cart: enrichedCart }
  })
}
// [POST]: /cart/add/:productId
module.exports.addPost = async (req,res) =>{
  const cartId = req.cartId
  const productId = req.params.productId
  const quantity = parseInt(req.body.quantity)
  const variantSku = req.body.variantSku || ""
  const cart = await Cart.findOne({_id: cartId}).lean()

  const product = await Product.findOne({_id: productId}).lean()
  if (!product) {
    return res.status(404).json({ code: 404, message: "Sản phẩm không tồn tại" })
  }
  let variant = null
  if (variantSku) {
    variant = product.variants.find(v => v.sku === variantSku)
    if (!variant) {
      return res.status(400).json({ code: 400, message: "Phiên bản sản phẩm không tồn tại" })
    }
  } else if (product.variants?.length) {
    return res.status(400).json({ code: 400, message: "Vui lòng chọn biến thể sản phẩm" })
  }

  const exitProductInCart = cart.products.find(
    item => item.product_id == productId && item.variantSku == variantSku
  )
  const currentQuantity = exitProductInCart ? exitProductInCart.quantity : 0
  const totalQuantity = currentQuantity + quantity
  if(exitProductInCart){
    await Cart.updateOne({
      _id: cartId,
      'products.product_id': productId,
      'products.variantSku': variantSku
    },{
      $set:{
        'products.$.quantity': totalQuantity
      }
    })
  }
  else{
    const objectCart = {
      product_id: productId,
      quantity: quantity,
      variantSku: variantSku,
      variantLabel: variant ? variant.label : "",
      variantOptions: variant ? variant.options : [],
      thumbnail: variant?.thumbnail || ""
    }
    await Cart.updateOne({
      _id: cartId
    },{
      $push : {
        products: objectCart
      }
    })
  }
  const updatedCart = await Cart.findOne({_id: cartId}).lean()
  const enrichedCart = await enrichCartData(updatedCart)
  res.json({
    code: 200,
    message: "Thêm sản phẩm vào giỏ hàng thành công",
    data: { cart: enrichedCart }
  })
}
// [DELETE]: /delete/:productId
module.exports.delete = async (req,res)=>{
  const productId = req.params.productId
  const cartId = req.cartId
  const variantSku = req.body.variantSku || ""
  await Cart.updateOne({
    _id:cartId
  },{
    $pull:{
      products: {
        product_id: productId,
        variantSku: variantSku
      }
    }
  })
  const updatedCart = await Cart.findOne({_id: cartId}).lean()
  const enrichedCart = await enrichCartData(updatedCart)
  res.json({
    code: 200,
    message: "Đã xóa sản phẩm khỏi giỏ hàng!",
    data: { cart: enrichedCart }
  })
}
// [PUT]: /update/:productId
module.exports.update = async (req,res)=>{
  const productId = req.params.productId
  const cartId = req.cartId
  const quantity = parseInt(req.body.quantity)
  const variantSku = req.body.variantSku || ""
  await Cart.updateOne({
    _id:cartId,
    'products.product_id': productId,
    'products.variantSku': variantSku
  },{
   'products.$.quantity': quantity
  })
  const updatedCart = await Cart.findOne({_id: cartId}).lean()
  const enrichedCart = await enrichCartData(updatedCart)
  res.json({
    code: 200,
    message: "Đã cập nhật số lượng!",
    data: { cart: enrichedCart }
  })
}