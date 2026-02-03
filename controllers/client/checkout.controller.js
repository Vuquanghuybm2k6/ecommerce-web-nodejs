const Order = require("../../models/order.model")
const Cart = require("../../models/cart.model")
const Product = require("../../models/product.model")
const productHelper = require("../../helper/product")
// [GET]: /checkout
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
// [POST]: /checkout/order
module.exports.order = async (req,res)=>{
  const cartId = req.cookies.cartId
  const cart = await Cart.findOne({_id:cartId})
  const userInfo = req.body
  let products = []
  for(const product of cart.products){
    let objectProduct = {
      product_id : product.product_id,
      quantity: product.quantity,
      discountPercentage : 0,
      price: 0
    }
    const productInfo = await Product.findOne({_id:product.product_id})
    objectProduct.discountPercentage = productInfo.discountPercentage
    objectProduct.price = productInfo.price
    products.push(objectProduct)
  }
  const objectOrder = {
    cart_id: cartId,
    userInfo: userInfo,
    products : products
  }
  const order = new Order(objectOrder)
  await order.save()
  await Cart.updateOne({ // sau khi đặt hàng thành công thì ta xóa hết sản phẩm trong giỏ hàng đi
    _id:cartId
  },{
    products : []
  })
  res.redirect(`/checkout/success/${order.id}`)
}
// [GET]: /checkout/success/:orderId
module.exports.success = async (req,res)=>{
  const orderId =req.params.orderId
  const order = await Order.findOne({_id: orderId})
  for(const product of order.products){
    const productInfo = await Product.findOne({_id:product.product_id}).select("title thumbnail")
    product.productInfo = productInfo
    product.priceNew = productHelper.priceNewProduct(product)
    product.totalPrice = product.priceNew * product.quantity
  }
  order.totalPrice = order.products.reduce((sum,item)=>sum+item.totalPrice,0)
  res.render("client/pages/checkout/success",{
    pageTitle: "Đặt hàng thành công",
    order: order
  })
}