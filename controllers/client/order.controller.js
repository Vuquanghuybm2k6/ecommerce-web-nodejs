const Cart = require("../../models/cart.model")
const Product = require("../../models/product.model")
const productHelper = require("../../helper/product")
// [GET]: /
module.exports.index = async (req,res)=>{
  const cartId = req.cookies.cartId
  const cart = await Cart.findOne({_id: cartId})
  if(cart.products.length > 0){
    for(const item of cart.products){
      const productInfo = await Product.findOne({_id:item.product_id})
      productInfo.priceNew = productHelper.priceNewProduct(productInfo)
      item.productInfo = productInfo
      item.totalPrice = item.quantity * productInfo.priceNew
    }
  }
  cart.totalPrice = cart.products.reduce((sum,item)=>sum + item.totalPrice, 0)
  res.render("client/pages/checkout/index",{
    pageTitle: "Đặt hàng",
    cartDetail: cart
  })
}