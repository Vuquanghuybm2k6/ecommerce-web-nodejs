const Order = require("../../models/order.model")
const Product = require("../../models/product.model")
const productHelper = require("../../helpers/product")
const paginationHelper = require("../../helpers/pagination")
const { sendOrderNotification } = require("../../helpers/orderNotification")
const mongoose = require("mongoose")

const enrichOrder = async (order) => {
  if (!order) return null

  const productInfos = await Promise.all(
    order.products.map(product => Product.findOne({ _id: product.product_id }).select("title thumbnail").lean())
  )

  order.products.forEach((product, index) => {
    product.productInfo = productInfos[index]
    product.priceNew = productHelper.priceNewProduct(product)
    product.totalPrice = product.priceNew * product.quantity
  })

  order.totalPrice = order.products.reduce((sum, item) => sum + item.totalPrice, 0)
  return order
}

module.exports.enrichOrder = enrichOrder

// [GET]: /api/orders
module.exports.index = async (req, res) => {
  const userId = req.user.id

  const find = { user_id: userId, deleted: false }

  const totalOrders = await Order.countDocuments(find)
  const pagination = paginationHelper(req.query, totalOrders, {
    currentPage: 1,
    limitItem: 10
  })
  pagination.totalItem = totalOrders

  const orders = await Order.find(find)
    .limit(pagination.limitItem)
    .skip(pagination.skip)
    .sort({ createdAt: -1 })
    .lean()

  const enrichedOrders = await Promise.all(orders.map(order => enrichOrder(order)))

  res.json({
    code: 200,
    message: "Thành công",
    data: { orders: enrichedOrders, pagination }
  })
}

// [GET]: /api/orders/:orderId
module.exports.detail = async (req, res) => {
  const userId = req.user.id
  const orderId = req.params.orderId

  const order = await Order.findOne({
    _id: orderId,
    user_id: userId,
    deleted: false
  }).lean()

  if (!order) {
    return res.status(404).json({
      code: 404,
      message: "Không tìm thấy đơn hàng"
    })
  }

  const enrichedOrder = await enrichOrder(order)

  res.json({
    code: 200,
    message: "Thành công",
    data: { order: enrichedOrder }
  })
}

// [PATCH]: /api/orders/cancel/:orderId
module.exports.cancel = async (req, res) => {
  const userId = req.user.id
  const orderId = req.params.orderId

  const order = await Order.findOne({
    _id: orderId,
    user_id: userId,
    deleted: false
  })

  if (!order) {
    return res.status(404).json({
      code: 404,
      message: "Không tìm thấy đơn hàng"
    })
  }

  if (order.status !== "pending" && order.status !== "pending_vnpay" && order.status !== "payment_failed") {
    return res.status(400).json({
      code: 400,
      message: "Chỉ có thể hủy đơn hàng đang chờ xác nhận"
    })
  }

  await Order.updateOne(
    { _id: orderId },
    { $set: { status: "cancelled" } }
  )

  sendOrderNotification(order, "cancelled")

  res.json({
    code: 200,
    message: "Hủy đơn hàng thành công"
  })
}
