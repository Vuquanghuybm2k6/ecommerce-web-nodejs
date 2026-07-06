const Cart = require("../../models/cart.model")
const Product = require("../../models/product.model")
const productHelper = require("../../helpers/product")
// [GET]: /cart
module.exports.index = async (req,res)=>{
  const cartId = req.cartId || req.body?.cartId || req.headers['x-cart-id']
  const cart = await Cart.findOne({_id: cartId})
  if(cart.products && cart.products.length > 0){
    for(const item of cart.products){
      const productInfo = await Product.findOne({_id: item.product_id})
      productInfo.priceNew = productHelper.priceNewProduct(productInfo)
      item.productInfo = productInfo
      item.totalPrice = productInfo.priceNew * item.quantity
    }
  }
  cart.totalPrice = cart.products.reduce((sum,item)=> sum + item.totalPrice, 0)
  res.json({
    code: 200,
    message: "Thành công",
    data: { cart: cart }
  })
}
// [POST]: /cart/add/:productId
module.exports.addPost = async (req,res) =>{
  const cartId = req.cartId || req.body?.cartId || req.headers['x-cart-id']
  const productId = req.params.productId
  const quantity = parseInt(req.body.quantity)
  const cart = await Cart.findOne({_id: cartId})
  const exitProductInCart = cart.products.find(item => item.product_id == productId)
  const currentQuantity = exitProductInCart ? exitProductInCart.quantity : 0
  const totalQuantity = currentQuantity + quantity
  if(exitProductInCart){
    await Cart.updateOne({
      _id: cartId,
      'products.product_id': productId
    },{
      $set:{
        'products.$.quantity': totalQuantity
      }
    })
  }
  else{
    const objectCart = {
      product_id: productId,
      quantity : quantity
    }
    await Cart.updateOne({
      _id: cartId
    },{
      $push : {
        products: objectCart
      }
    })
  }
  const updatedCart = await Cart.findOne({_id: cartId})
  res.json({
    code: 200,
    message: "Thêm sản phẩm vào giỏ hàng thành công",
    data: { cart: updatedCart }
  })
}
// [GET]: /delete/:productId
module.exports.delete = async (req,res)=>{
  const productId = req.params.productId
  const cartId = req.cartId || req.body?.cartId || req.headers['x-cart-id']
  await Cart.updateOne({
    _id:cartId
  },{
    $pull:{
      products: {
        'product_id': productId
      }
    }
  })
  const updatedCart = await Cart.findOne({_id: cartId})
  res.json({
    code: 200,
    message: "Đã xóa sản phẩm khỏi giỏ hàng!",
    data: { cart: updatedCart }
  })
}
// [GET]: /update/:productId/:quantity
module.exports.update = async (req,res)=>{
  const productId = req.params.productId
  const cartId = req.cartId || req.body?.cartId || req.headers['x-cart-id']
  const quantity = parseInt(req.params.quantity)
  await Cart.updateOne({
    _id:cartId,
    'products.product_id': productId
  },{
   'products.$.quantity': quantity
  })
  const updatedCart = await Cart.findOne({_id: cartId})
  res.json({
    code: 200,
    message: "Đã cập nhật số lượng!",
    data: { cart: updatedCart }
  })
}