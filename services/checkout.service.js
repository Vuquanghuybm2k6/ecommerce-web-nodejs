const Order = require("../models/order.model")
const Cart = require("../models/cart.model")
const cartService = require("./cart.service")
const httpError = require("../helpers/httpError")
const { runInTransaction } = require("../helpers/transaction")
const { enrichCartData } = require("../helpers/cart")
const { enrichOrder } = require("../helpers/order")
const { buildPaymentUrl } = require("../helpers/vnpay")
const { logAction } = require("../helpers/logger")

const getCheckoutDetail = async (cartId) => {
  const cart = await Cart.findOne({ _id: cartId }).lean()
  return { cartDetail: await enrichCartData(cart) }
}

const createOrder = async ({ cartId, body, userId, ipAddr }) => {
  const cart = await Cart.findOne({ _id: cartId }).lean()
  if (!cart) throw httpError(404, "Giỏ hàng không tồn tại")
  if (!cart.products || cart.products.length === 0) throw httpError(400, "Giỏ hàng đang trống")

  // Dùng chung cách tính giá với cart service để giá trong đơn luôn khớp giỏ
  const { products, totalPrice } = await cartService.buildOrderLines(cart.products)

  const orderCode = "DH" + Date.now().toString().slice(-8)
  const paymentMethod = body.paymentMethod === 'vnpay' ? 'vnpay' : 'cod'

  const objectOrder = {
    cart_id: cartId,
    userInfo: {
      fullName: body.fullName,
      phone: body.phone,
      address: body.address
    },
    products: products,
    status: 'pending',
    user_id: userId || '',
    paymentMethod: paymentMethod,
    paymentStatus: paymentMethod === 'vnpay' ? 'pending' : 'paid',
    shippingMethod: body.shippingMethod || '',
    totalPrice: totalPrice,
    orderCode: orderCode,
    paymentRefs: [orderCode]
  }

  const order = await runInTransaction(async (session) => {
    const newOrder = new Order(objectOrder)
    await newOrder.save({ session })

    await Cart.updateOne(
      { _id: cartId },
      { $set: { products: [] } },
      { session }
    )

    return newOrder
  })

  logAction('payment', 'create_order', `Order ${orderCode} created via ${paymentMethod}`, {
    orderId: order.id,
    orderCode: orderCode,
    paymentMethod: paymentMethod
  })

  let paymentUrl = null
  if (paymentMethod === 'vnpay') {
    paymentUrl = buildPaymentUrl({
      amount: totalPrice,
      orderCode: orderCode,
      returnUrl: process.env.VNP_RETURN_URL,
      ipAddr: ipAddr,
      locale: 'vn',
    })
  }

  return {
    orderId: order.id,
    orderCode: orderCode,
    paymentMethod: paymentMethod,
    paymentUrl: paymentUrl
  }
}

const getOrderSuccessDetail = async (orderId) => {
  const order = await Order.findOne({ _id: orderId }).lean()
  if (!order) throw httpError(404, "Không tìm thấy đơn hàng")

  return { order: await enrichOrder(order) }
}

module.exports = {
  getCheckoutDetail,
  createOrder,
  getOrderSuccessDetail
}
