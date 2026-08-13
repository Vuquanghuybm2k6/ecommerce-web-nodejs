const Order = require("../../models/order.model")
const Cart = require("../../models/cart.model")
const Product = require("../../models/product.model")
const { logAction, logger } = require("../../helpers/logger")
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
    let variant = null
    if (product.variantSku && productInfo) {
      variant = productInfo.variants.find(v => v.sku === product.variantSku)
    }
    const itemPrice = variant?.price || 0
    const discountPercentage = variant?.discountPercentage || 0
    const itemPriceNew = Number((itemPrice - itemPrice * discountPercentage / 100).toFixed(0))

    products.push({
      product_id: product.product_id,
      quantity: product.quantity,
      discountPercentage,
      price: itemPrice,
      priceNew: itemPriceNew,
      variantSku: product.variantSku || "",
      variantLabel: product.variantLabel || "",
      variantOptions: product.variantOptions || []
    })
    totalPrice += itemPriceNew * product.quantity
  })

  const orderCode = "DH" + Date.now().toString().slice(-8) // tạo mã đơn hàng

  const paymentMethod = req.body.paymentMethod === 'vnpay' ? 'vnpay' : 'cod'

  const objectOrder = {
    cart_id: cartId,
    userInfo,
    products,
    status: 'pending',
    user_id: req.user?.id || '',
    paymentMethod,
    paymentStatus: paymentMethod === 'vnpay' ? 'pending' : 'paid',
    shippingMethod: req.body.shippingMethod || '',
    totalPrice,
    orderCode,
    paymentRefs: [orderCode]
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

    logAction('payment', 'create_order', `Order ${orderCode} created via ${paymentMethod}`, { orderId: order.id, orderCode, paymentMethod })

    let paymentUrl = null
    if (paymentMethod === 'vnpay') {
      const { buildPaymentUrl, getClientIp } = require("../../helpers/vnpay")
      paymentUrl = buildPaymentUrl({
        amount: totalPrice,
        orderCode,
        returnUrl: process.env.VNP_RETURN_URL,
        ipAddr: getClientIp(req),
        locale: 'vn',
      })
    } 

    const message = paymentMethod === 'vnpay' ? "Chuyển hướng thanh toán VNPay" : "Đặt hàng thành công"
    res.status(200).json({ code: 200, message, data: { orderId: order.id, orderCode, paymentUrl } })
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
    order.products.map(product => Product.findOne({_id: product.product_id}).select("title variants"))
  )
  order.products.forEach((product, index) => {
    const productInfo = productInfos[index]
    const thumbnail = productInfo?.variants?.[0]?.thumbnail || ''
    product.productInfo = productInfo ? { ...productInfo, thumbnail } : null
    product.totalPrice = (product.priceNew || 0) * product.quantity
  })
  order.totalPrice = order.products.reduce((sum,item)=>sum+item.totalPrice,0)
  res.json({
    code: 200,
    message: "Thành công",
    data: { order: order }
  })
}