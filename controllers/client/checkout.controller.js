const Order = require("../../models/order.model")
const Cart = require("../../models/cart.model")
const Product = require("../../models/product.model")
const productHelper = require("../../helpers/product")
const { sendOrderNotification } = require("../../helpers/orderNotification")
const { logAction, logger } = require("../../helpers/logger")
const mongoose = require("mongoose")
const { enrichCartData } = require("./cart.controller")
const vnpayHelper = require("../../helpers/vnpay.helper")
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

  const isVnPay = req.body.paymentMethod === "vnpay"
  const objectOrder = {
    cart_id: cartId,
    userInfo,
    products,
    status: isVnPay? 'pending_vnpay': 'pending',
    user_id: req.user?.id || '',
    paymentMethod: isVnPay ? 'vnpay' : 'cod',
    shippingMethod: req.body.shippingMethod || '',
    totalPrice,
    orderCode
  }

  const session = await mongoose.startSession()
  session.startTransaction()
  try {
    const order = new Order(objectOrder)
    await order.save({ session })

    await Cart.updateOne(
      { _id: cartId },
      { $set: { products : [] } },
      { session }
    )

    await session.commitTransaction()

    if (isVnPay) {
      const paymentUrl = vnpayHelper.createPaymentUrl(order, req)
      logAction('payment', 'create_order_vnpay', `Order ${orderCode} created via VNPay`, { orderId: order.id, orderCode, paymentMethod: 'vnpay' })
      return res.status(200).json({
        code: 200,
        message: "Chuyển hướng đến cổng thanh toán VNPay",
        data: { paymentUrl, orderId: order.id, orderCode }
      })
    }

    logAction('payment', 'create_order_cod', `Order ${orderCode} created via COD`, { orderId: order.id, orderCode, paymentMethod: 'cod' })
    res.status(200).json({ code: 200, message: "Đặt hàng thành công", data: { orderId: order.id, orderCode } })
  } catch (error) {
    await session.abortTransaction() // nếu có lỗi thì mongodb sẽ khôi phục cái session vừa tạo
    logger.error('Đặt hàng thất bại', { error: error.message, stack: error.stack })
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

// [GET]: /checkout/vnpay-return
module.exports.vnpayReturn = async (req, res) => {
  const result = vnpayHelper.verifyReturn(req.query)

  const order = await Order.findOne({ orderCode: result.txnRef })
  if (!order) {
    return res.redirect(`${process.env.VNP_FRONTEND_RETURN_URL}?success=false&message=Order not found`)
  }

  const paymentInfo = {
    transactionId: result.transactionNo,
    bankCode: result.bankCode,
    payDate: result.payDate,
    paymentStatus: result.isValid && result.responseCode === '00' ? 'success' : 'failed'
  }

  const newStatus = (result.isValid && result.responseCode === '00') ? 'pending' : 'payment_failed'

  await Order.updateOne(
    { _id: order._id },
    { $set: { status: newStatus, paymentInfo } }
  )

  const frontendUrl = new URL(process.env.VNP_FRONTEND_RETURN_URL)
  frontendUrl.searchParams.set('success', newStatus === 'pending' ? 'true' : 'false')
  if (newStatus === 'pending') {
    frontendUrl.searchParams.set('orderId', order._id.toString())
  }

  sendOrderNotification(order, newStatus)

  logAction('payment', 'vnpay_return', `VNPay return for order ${order.orderCode}: ${newStatus}`, {
    orderCode: order.orderCode,
    orderId: order._id.toString(),
    newStatus,
    transactionId: paymentInfo.transactionId,
    bankCode: paymentInfo.bankCode,
    responseCode: result.responseCode,
  })

  res.redirect(frontendUrl.toString())
}