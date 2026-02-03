const Cart = require("../../models/cart.model")
// [POST]: /admin/cart/add/:productId
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