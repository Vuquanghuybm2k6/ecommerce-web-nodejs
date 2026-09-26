const { findProductMapByIds } = require("./product")

const orderStatuses = [
  { name: "Tất cả", class: "", status: "" },
  { name: "Chờ xác nhận", class: "", status: "pending" },
  { name: "Đã xác nhận", class: "", status: "confirmed" },
  { name: "Đang giao hàng", class: "", status: "shipped" },
  { name: "Đã giao hàng", class: "", status: "delivered" },
  { name: "Đã hủy", class: "", status: "cancelled" },
]

const buildOrderStatusFilter = (status) =>
  orderStatuses.map(item => ({
    ...item,
    class: item.status === (status || "") ? "active" : ""
  }))

// Gắn thông tin sản phẩm (title, thumbnail) và tổng tiền từng dòng vào order.
// Gom tất cả product_id của cả danh sách order thành 1 truy vấn $in để tránh N+1
// (trước đây admin gọi enrichOrder trong Promise.all nên nhân bản thành N x M truy vấn).
const enrichOrders = async (orders) => {
  if (!orders || orders.length === 0) return []

  const productIds = orders.flatMap(order => (order.products || []).map(item => item.product_id))
  const productMap = await findProductMapByIds(productIds, "title variants")

  orders.forEach(order => {
    ;(order.products || []).forEach(product => {
      const productInfo = productMap[String(product.product_id)]
      const thumbnail = productInfo?.variants?.[0]?.thumbnail || ""
      product.productInfo = productInfo ? { ...productInfo, thumbnail } : null
      product.totalPrice = (product.priceNew || 0) * product.quantity
    })

    order.totalPrice = (order.products || []).reduce((sum, item) => sum + item.totalPrice, 0)
  })

  return orders
}

const enrichOrder = async (order) => {
  if (!order) return null
  const [enriched] = await enrichOrders([order])
  return enriched
}

module.exports = { orderStatuses, buildOrderStatusFilter, enrichOrder, enrichOrders }
