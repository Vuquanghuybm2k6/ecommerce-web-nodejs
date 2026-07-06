const Order = require("../../models/order.model")
const paginationHelper = require("../../helpers/pagination")
const searchHelper = require("../../helpers/search")
const { enrichOrder } = require("../client/order.controller")

const orderStatuses = [
  { name: "Tất cả", class: "", status: "" },
  { name: "Chờ xác nhận", class: "", status: "pending" },
  { name: "Đã xác nhận", class: "", status: "confirmed" },
  { name: "Đang giao hàng", class: "", status: "shipped" },
  { name: "Đã giao hàng", class: "", status: "delivered" },
  { name: "Đã hủy", class: "", status: "cancelled" },
]

// [GET]: /admin/orders
module.exports.index = async (req, res) => {
  let find = { deleted: false }
  if (req.query.status) find.status = req.query.status
  if (req.query.keyword) find.orderCode = searchHelper(req.query)

  const filterStatus = orderStatuses.map(item => ({
    ...item,
    class: item.status === (req.query.status || "") ? "active" : ""
  }))

  const totalOrder = await Order.countDocuments(find)
  const pagination = paginationHelper(req.query, totalOrder, {
    currentPage: 1,
    limitItem: 10
  })

  const sort = {}
  if (req.query.sortKey && req.query.sortValue) {
    sort[req.query.sortKey] = req.query.sortValue
  } else {
    sort.createdAt = "desc"
  }

  const orders = await Order.find(find)
    .limit(pagination.limitItem)
    .skip(pagination.skip)
    .sort(sort)
    .lean()

  const enrichedOrders = await Promise.all(orders.map(order => enrichOrder(order)))

  res.json({
    code: 200,
    message: "Thành công",
    data: {
      orders: enrichedOrders,
      filterStatus,
      keyword: req.query.keyword || "",
      pagination
    }
  })
}

// [GET]: /admin/orders/detail/:id
module.exports.detail = async (req, res) => {
  try {
    const id = req.params.id
    const order = await Order.findOne({ _id: id, deleted: false }).lean()
    if (!order) {
      return res.status(404).json({ code: 404, message: "Không tìm thấy đơn hàng" })
    }
    const enrichedOrder = await enrichOrder(order)
    res.json({
      code: 200,
      message: "Thành công",
      data: { order: enrichedOrder }
    })
  } catch (error) {
    res.status(400).json({ code: 400, message: "Lỗi" })
  }
}

// [PATCH]: /admin/orders/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {
  const id = req.params.id
  const status = req.params.status
  const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"]
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ code: 400, message: "Trạng thái không hợp lệ" })
  }
  await Order.updateOne({ _id: id }, { $set: { status } })
  res.json({
    code: 200,
    message: "Cập nhật trạng thái thành công"
  })
}

// [PATCH]: /admin/orders/delete/:id
module.exports.delete = async (req, res) => {
  const id = req.params.id
  await Order.updateOne({ _id: id }, { deleted: true })
  res.json({
    code: 200,
    message: "Xóa đơn hàng thành công"
  })
}
