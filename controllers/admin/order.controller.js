const Order = require("../../models/order.model")
const Product = require("../../models/product.model")
const User = require("../../models/user.model")
const paginationHelper = require("../../helpers/pagination")
const searchHelper = require("../../helpers/search")
const { enrichOrder } = require("../client/order.controller")
const { isValidTransition } = require("../../helpers/orderStatus")
const sendMailHelper = require("../../helpers/sendMail")
const mongoose = require("mongoose")

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

const sendStatusEmail = async (order, newStatus, reason) => {
  if (!order.user_id) return
  const user = await User.findOne({ _id: order.user_id }).select("email")
  if (!user?.email) return

  let subject, body
  const orderCode = order.orderCode || ""
  const total = (order.totalPrice || 0).toLocaleString("vi-VN")

  switch (newStatus) {
    case "confirmed":
      subject = `Đơn hàng ${orderCode} đã được xác nhận`
      body = `<p>Đơn hàng <b>${orderCode}</b> của bạn đã được xác nhận.</p>
              <p>Tổng tiền: <b>${total}₫</b></p>
              <p>Chúng tôi sẽ giao hàng trong thời gian sớm nhất.</p>`
      break
    case "shipped":
      subject = `Đơn hàng ${orderCode} đang được giao`
      body = `<p>Đơn hàng <b>${orderCode}</b> của bạn đang được giao.</p>
              <p>Tổng tiền: <b>${total}₫</b></p>
              <p>Vui lòng chú ý điện thoại để nhận hàng.</p>`
      break
    case "delivered":
      subject = `Đơn hàng ${orderCode} đã giao thành công`
      body = `<p>Đơn hàng <b>${orderCode}</b> đã được giao thành công.</p>
              <p>Cảm ơn bạn đã mua hàng!</p>`
      break
    case "cancelled":
      subject = `Đơn hàng ${orderCode} đã bị hủy`
      body = `<p>Đơn hàng <b>${orderCode}</b> của bạn đã bị hủy.</p>`
      if (reason) body += `<p>Lý do: ${reason}</p>`
      break
    default:
      return
  }

  sendMailHelper.sendMail(user.email, subject, body)
}

// [PATCH]: /admin/orders/change-status/:id
module.exports.changeStatus = async (req, res) => {
  const id = req.params.id
  const newStatus = req.body.status
  const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"]
  if (!validStatuses.includes(newStatus)) {
    return res.status(400).json({ code: 400, message: "Trạng thái không hợp lệ" })
  }

  const order = await Order.findOne({ _id: id, deleted: false }).lean()
  if (!order) {
    return res.status(404).json({ code: 404, message: "Không tìm thấy đơn hàng" })
  }

  if (!isValidTransition(order.status, newStatus)) {
    return res.status(400).json({
      code: 400,
      message: `Không thể chuyển từ "${order.status}" sang "${newStatus}"`
    })
  }

  if (!order.products || order.products.length === 0) {
    return res.status(400).json({ code: 400, message: "Đơn hàng không có sản phẩm" })
  }

  if (newStatus === "confirmed" && order.status === "pending") {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
      for (const product of order.products) {
        const productDoc = await Product.findOne({ _id: product.product_id }).session(session)
        if (!productDoc) {
          throw new Error(`Không tìm thấy sản phẩm ${product.product_id}`)
        }
        if (productDoc.stock < product.quantity) {
          throw new Error(`Sản phẩm "${productDoc.title}" không đủ hàng (còn ${productDoc.stock}, cần ${product.quantity})`)
        }
        await Product.updateOne(
          { _id: product.product_id },
          { $inc: { stock: -product.quantity } },
          { session }
        )
      }
      await Order.updateOne(
        { _id: id },
        { $set: { status: newStatus } },
        { session }
      )
      await session.commitTransaction()
    } catch (error) {
      await session.abortTransaction()
      console.error("Confirm transaction failed:", error)
      return res.status(500).json({
        code: 500,
        message: error.message || "Xác nhận đơn hàng thất bại"
      })
    } finally {
      session.endSession()
    }
  } else if (newStatus === "cancelled" && order.status !== "pending") {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
      for (const product of order.products) {
        const result = await Product.updateOne(
          { _id: product.product_id },
          { $inc: { stock: product.quantity } },
          { session }
        )
        if (result.matchedCount === 0) {
          throw new Error(`Không tìm thấy sản phẩm ${product.product_id}`)
        }
      }
      await Order.updateOne(
        { _id: id },
        { $set: { status: newStatus } },
        { session }
      )
      await session.commitTransaction()
    } catch (error) {
      await session.abortTransaction()
      console.error("Cancel transaction failed:", error)
      return res.status(500).json({
        code: 500,
        message: error.message || "Hủy đơn hàng thất bại"
      })
    } finally {
      session.endSession()
    }
  } else {
    await Order.updateOne({ _id: id }, { $set: { status: newStatus } })
  }

  sendStatusEmail(order, newStatus, req.body.reason)

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
