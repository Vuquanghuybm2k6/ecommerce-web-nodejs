const Order = require("../models/order.model")
const Product = require("../models/product.model")
const httpError = require("../helpers/httpError")
const searchHelper = require("../helpers/search")
const paginationHelper = require("../helpers/pagination")
const { isValidTransition } = require("../helpers/orderStatus")
const { sendOrderNotification } = require("../helpers/orderNotification")
const { runInTransaction } = require("../helpers/transaction")
const { enrichOrder, enrichOrders, buildOrderStatusFilter } = require("../helpers/order")
const { logAction } = require("../helpers/logger")

const VALID_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"]

// Trừ (direction = -1) hoặc hoàn (direction = 1) tồn kho của đúng biến thể trong từng dòng đơn hàng.
// Gom toàn bộ sản phẩm thành 1 truy vấn $in rồi ghi bằng 1 bulkWrite,
// thay cho vòng lặp await findOne + await updateOne tuần tự trong transaction (2N round-trip).
const adjustStock = async (orderProducts, direction, session) => {
  const productIds = [...new Set(orderProducts.map(item => item.product_id).filter(Boolean))]

  const products = await Product.find({ _id: { $in: productIds } })
    .select("title variants")
    .session(session)
    .lean()

  const productMap = {}
  products.forEach(product => { productMap[String(product._id)] = product })

  const deltas = new Map()
  for (const line of orderProducts) {
    const productDoc = productMap[String(line.product_id)]
    if (!productDoc) {
      throw httpError(404, `Không tìm thấy sản phẩm ${line.product_id}`)
    }

    const matchSku = line.variantSku || ""
    let variantIndex = (productDoc.variants || []).findIndex(v => v.sku === matchSku)
    if (variantIndex === -1) variantIndex = 0

    const targetVariant = productDoc.variants?.[variantIndex]
    if (!targetVariant) continue

    if (direction < 0 && (targetVariant.stock || 0) < line.quantity) {
      throw httpError(400, `Sản phẩm "${productDoc.title}" (${targetVariant.label}) không đủ hàng (còn ${targetVariant.stock}, cần ${line.quantity})`)
    }

    if (!deltas.has(line.product_id)) deltas.set(line.product_id, new Map())
    const byVariant = deltas.get(line.product_id)
    byVariant.set(variantIndex, (byVariant.get(variantIndex) || 0) + direction * line.quantity)
  }

  const operations = []
  deltas.forEach((byVariant, productId) => {
    byVariant.forEach((delta, variantIndex) => {
      operations.push({
        updateOne: {
          filter: { _id: productId },
          update: { $inc: { [`variants.${variantIndex}.stock`]: delta } }
        }
      })
    })
  })

  if (operations.length > 0) {
    await Product.bulkWrite(operations, { session })
  }
}

const listOrders = async (query) => {
  const find = { deleted: false }
  if (query.status) find.status = query.status
  if (query.keyword) find.orderCode = searchHelper(query)

  const totalOrder = await Order.countDocuments(find)
  const pagination = paginationHelper(query, totalOrder, {
    currentPage: 1,
    limitItem: 10
  })

  const sort = {}
  if (query.sortKey && query.sortValue) {
    sort[query.sortKey] = query.sortValue
  } else {
    sort.createdAt = "desc"
  }

  const orders = await Order.find(find)
    .limit(pagination.limitItem)
    .skip(pagination.skip)
    .sort(sort)
    .lean()

  return {
    orders: await enrichOrders(orders),
    filterStatus: buildOrderStatusFilter(query.status),
    keyword: query.keyword || "",
    pagination: pagination
  }
}

const listOrdersByUser = async ({ userId, query }) => {
  const find = { user_id: userId, deleted: false }

  const totalOrders = await Order.countDocuments(find)
  const pagination = paginationHelper(query, totalOrders, {
    currentPage: 1,
    limitItem: 10
  })
  pagination.totalItem = totalOrders

  const orders = await Order.find(find)
    .limit(pagination.limitItem)
    .skip(pagination.skip)
    .sort({ createdAt: -1 })
    .lean()

  return { orders: await enrichOrders(orders), pagination: pagination }
}

const getOrderDetail = async (id) => {
  const order = await Order.findOne({ _id: id, deleted: false }).lean()
  if (!order) throw httpError(404, "Không tìm thấy đơn hàng")

  return { order: await enrichOrder(order) }
}

const getOrderDetailByUser = async ({ orderId, userId }) => {
  const order = await Order.findOne({
    _id: orderId,
    user_id: userId,
    deleted: false
  }).lean()

  if (!order) throw httpError(404, "Không tìm thấy đơn hàng")

  return { order: await enrichOrder(order) }
}

const changeStatus = async ({ id, newStatus, reason, adminId }) => {
  if (!VALID_STATUSES.includes(newStatus)) {
    throw httpError(400, "Trạng thái không hợp lệ")
  }

  const order = await Order.findOne({ _id: id, deleted: false }).lean()
  if (!order) throw httpError(404, "Không tìm thấy đơn hàng")

  if (!isValidTransition(order.status, newStatus)) {
    throw httpError(400, `Không thể chuyển từ "${order.status}" sang "${newStatus}"`)
  }

  if (!order.products || order.products.length === 0) {
    throw httpError(400, "Đơn hàng không có sản phẩm")
  }

  // Xác nhận đơn thì trừ kho, hủy đơn đã xác nhận thì hoàn kho, còn lại chỉ đổi trạng thái.
  const stockDirection = (newStatus === "confirmed" && order.status === "pending")
    ? -1
    : (newStatus === "cancelled" && order.status !== "pending") ? 1 : 0

  if (stockDirection !== 0) {
    await runInTransaction(async session => {
      await adjustStock(order.products, stockDirection, session)
      await Order.updateOne(
        { _id: id },
        { $set: { status: newStatus } },
        { session }
      )
    })
  } else {
    await Order.updateOne({ _id: id }, { $set: { status: newStatus } })
  }

  sendOrderNotification(order, newStatus, reason)

  logAction('order', 'change_status', `Order ${order.orderCode} status changed: ${order.status} -> ${newStatus}`, {
    orderId: id,
    orderCode: order.orderCode,
    fromStatus: order.status,
    toStatus: newStatus,
    reason: reason || '',
    adminId: adminId,
  })
}

const cancelByUser = async ({ orderId, userId }) => {
  const order = await Order.findOne({
    _id: orderId,
    user_id: userId,
    deleted: false
  })

  if (!order) throw httpError(404, "Không tìm thấy đơn hàng")

  if (order.status !== "pending") {
    throw httpError(400, "Chỉ có thể hủy đơn hàng đang chờ xác nhận")
  }

  if (order.paymentStatus === "paid") {
    throw httpError(400, "Đơn hàng đã thanh toán, không thể hủy")
  }

  await Order.updateOne(
    { _id: orderId },
    { $set: { status: "cancelled" } }
  )

  sendOrderNotification(order, "cancelled")

  logAction('order', 'user_cancel', `User cancelled order ${order.orderCode}`, {
    orderCode: order.orderCode,
    orderId: orderId,
    userId: userId,
  })
}

const softDelete = async (id) => {
  await Order.updateOne({ _id: id }, { deleted: true })
}

module.exports = {
  adjustStock,
  listOrders,
  listOrdersByUser,
  getOrderDetail,
  getOrderDetailByUser,
  changeStatus,
  cancelByUser,
  softDelete
}
