const Cart = require("../../models/cart.model")
const Product = require("../../models/product.model")
const productHelper = require("../../helper/product")
// [GET]: /cart
module.exports.index = async (req,res)=>{
  const cartId = req.cookies.cartId
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
  res.render("client/pages/cart/index",{
    pageTitle: "Giỏ hàng",
    cartDetail : cart
  })
}
// [POST]: /cart/add/:productId
module.exports.addPost = async (req,res) =>{
  const cartId = req.cookies.cartId
  const productId = req.params.productId
  const quantity = parseInt(req.body.quantity)
  const cart = await Cart.findOne({_id: cartId})
  if(!cart){
    req.flash("error", "Giỏ hàng không tồn tại")
    return res.redirect(req.get("Referer"))
  }
  const exitProductInCart = cart.products.find(item => item.product_id == productId)
  if(exitProductInCart){
    const newQuantity = exitProductInCart.quantity + quantity
    await Cart.updateOne({
      _id: cartId,
      'products.product_id': productId
    },{
      $set:{
        'products.$.quantity': newQuantity
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
  req.flash("success","Them sản phẩm vào giỏ hàng thành công")
  res.redirect(req.get("Referer"))
}
// [GET]: /delete/:productId
module.exports.delete = async (req,res)=>{
  const productId = req.params.productId
  const cartId = req.cookies.cartId
  await Cart.updateOne({
    _id:cartId
  },{
    $pull:{
      products: {
        'product_id': productId
      }
    }
  })
  req.flash("success", "Đã xóa sản phẩm khỏi giỏ hàng!")
  res.redirect(req.get("Referer"))
}
// [GET]: /update/:productId/:quantity
module.exports.update = async (req,res)=>{
  const productId = req.params.productId
  const cartId = req.cookies.cartId
  const quantity = req.params.quantity
  await Cart.updateOne({
    _id:cartId,
    'products.product_id': productId
  },{
   'products.$.quantity': quantity
  })
  req.flash("success", "Đã cập nhật số lượng!")
  res.redirect(req.get("Referer"))
}