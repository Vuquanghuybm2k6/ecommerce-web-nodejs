const Order = require("../../models/order.model")
const Cart = require("../../models/cart.model")
const Product = require("../../models/product.model")
const productHelper = require("../../helpers/product")
const sendMailHelper = require("../../helpers/sendMail")
const mongoose = require("mongoose")
const { enrichCartData } = require("./cart.controller")

// [GET]: /checkout
module.exports.index = async (req,res)=>{
  const cartId = req.cartId
  const cart = await Cart.findOne({_id: cartId}).lean()
  const enrichedCart = await enrichCartData(cart)
  res.json({
    code: 200,
    message: "Thành công",
    data: { cartDetail: enrichedCart }
  })
}

// [POST]: /checkout/order
module.exports.order = async (req,res)=>{
  const cartId = req.cartId
  const cart = await Cart.findOne({_id:cartId}).lean()

  const userInfo = {
    fullName: req.body.fullName,
    phone: req.body.phone,
    address: req.body.address
  }

  const productInfos = await Promise.all(
    cart.products.map(product => Product.findOne({_id: product.product_id}))
  )

  let products = []
  let totalPrice = 0
  cart.products.forEach((product, index) => {
    const productInfo = productInfos[index]
    const priceNew = productHelper.priceNewProduct(productInfo)
    products.push({
      product_id: product.product_id,
      quantity: product.quantity,
      discountPercentage: productInfo.discountPercentage,
      price: productInfo.price,
      priceNew: priceNew
    })
    totalPrice += priceNew * product.quantity
  })

  const orderCode = "DH" + Date.now().toString().slice(-8) // tạo mã đơn hàng

  const objectOrder = {
    cart_id: cartId,
    userInfo: userInfo,
    products : products,
    status: 'pending',
    user_id: req.user?.id || '',
    paymentMethod: req.body.paymentMethod || 'COD',
    shippingMethod: req.body.shippingMethod || '',
    totalPrice: totalPrice,
    orderCode: orderCode
  }

  const session = await mongoose.startSession()
  session.startTransaction()
  try {
    const order = new Order(objectOrder)
    await order.save({ session })

    await Cart.updateOne(
      { _id: cartId },
      { products : [] },
      { session }
    )

    await session.commitTransaction()

    if(req.user?.email){
      sendMailHelper.sendMail(
        req.user.email,
        `Xác nhận đơn hàng ${orderCode}`,
        `<p>Cảm ơn bạn đã đặt hàng.</p>
         <p>Mã đơn: <b>${orderCode}</b></p>
         <p>Tổng tiền: <b>${totalPrice.toLocaleString('vi-VN')}₫</b></p>
         <p>Chúng tôi sẽ giao hàng trong thời gian sớm nhất.</p>`
      )
    }

    res.status(200).json({ code: 200, message: "Đặt hàng thành công", data: { orderId: order.id, orderCode } })
  } catch (error) {
    await session.abortTransaction() // nếu có lỗi thì mongodb sẽ khôi phục cái session vừa tạo
    console.error(error)
    res.status(500).json({ code: 500, message: "Đặt hàng thất bại" })
  } finally {
    session.endSession()
  }
}

// [GET]: /checkout/success/:orderId
module.exports.success = async (req,res)=>{
  const orderId =req.params.orderId
  const order = await Order.findOne({_id: orderId}).lean()
  const productInfos = await Promise.all(
    order.products.map(product => Product.findOne({_id: product.product_id}).select("title thumbnail"))
  )
  order.products.forEach((product, index) => {
    product.productInfo = productInfos[index]
    product.priceNew = productHelper.priceNewProduct(product)
    product.totalPrice = product.priceNew * product.quantity
  })
  order.totalPrice = order.products.reduce((sum,item)=>sum+item.totalPrice,0)
  res.json({
    code: 200,
    message: "Thành công",
    data: { order: order }
  })
}