const Order = require("../models/order.model")
const Cart = require("../models/cart.model")
const httpError = require("../helpers/httpError")
const { config, verifyParams, buildPaymentUrl } = require("../helpers/vnpay")
const { applyOrderToCart } = require("../helpers/cart")
const { logAction, logger } = require("../helpers/logger")

const PAY_AGAIN_WINDOW_MS = 24 * 60 * 60 * 1000

const findOrderByPaymentRef = (orderCode) =>
  Order.findOne({ $or: [{ paymentRefs: orderCode }, { orderCode }] })

// Mã 01 (giao dịch chưa hoàn tất) = khách mất điện/thoát giữa trang thanh toán → vẫn chờ thanh toán
const resolvePaymentStatus = ({ responseCode, transactionStatus }) => {
  if (responseCode === "00") return "paid"
  if (transactionStatus === "01") return "pending"
  return "failed"
}

// Sau khi thanh toán thành công, trừ các mặt hàng đã đặt khỏi giỏ hiện tại
// để tránh user mua trùng nếu đã re-add hàng vào giỏ trước đó.
const removeOrderedItemsFromCart = async (order) => {
  let cart = null
  if (order.user_id) {
    cart = await Cart.findOne({ user_id: order.user_id }).sort({ createdAt: -1 })
  }
  if (!cart && order.cart_id) {
    cart = await Cart.findById(order.cart_id)
  }
  if (!cart) return
  applyOrderToCart(cart, order.products)
  await cart.save()
}

// Ghi trạng thái thanh toán theo cách atomic, không ghi đè đơn đã paid/failed từ IPN
// để tránh race khi return và IPN chạy cùng lúc.
const settleOrderPayment = async ({ order, paymentStatus, logMeta }) => {
  const updated = await Order.findOneAndUpdate(
    {
      _id: order._id,
      paymentStatus: { $nin: ["paid", "failed"] }
    },
    { $set: { paymentStatus: paymentStatus } },
    { new: true }
  )

  if (paymentStatus === "paid" && updated) {
    await removeOrderedItemsFromCart(order)
  }

  logAction("payment", logMeta.action, logMeta.message, { ...logMeta.context, updated: !!updated })

  return updated
}

// Redirect từ VNPay sau khi user hoàn tất thanh toán.
// Cập nhật paymentStatus trong DB như phương án dự phòng, vì IPN (server-to-server)
// chỉ chạy khi backend có URL công khai và được đăng ký ở cổng VNPay.
const getReturnRedirectUrl = async (vnp_Params) => {
  if (!verifyParams(vnp_Params)) {
    return `${config.frontendReturnUrl}?success=false&message=invalid_signature`
  }

  const orderCode = vnp_Params["vnp_TxnRef"] || ""
  const order = await findOrderByPaymentRef(orderCode)
  const responseCode = vnp_Params["vnp_ResponseCode"] || ""
  const txnStatus = vnp_Params["vnp_TransactionStatus"] || ""
  const newStatus = resolvePaymentStatus({ responseCode, transactionStatus: txnStatus })

  if (order) {
    try {
      await settleOrderPayment({
        order: order,
        paymentStatus: newStatus,
        logMeta: {
          action: "vnpay_return",
          message: `VNPay return for order ${order.orderCode}`,
          context: { orderCode: order.orderCode, responseCode, txnStatus, paymentStatus: newStatus }
        }
      })
    } catch (error) {
      logger.error("VNPay return update thất bại", {
        category: "payment",
        action: "vnpay_return",
        orderCode: order.orderCode,
        error: error.message,
      })
    }
  }

  const query = new URLSearchParams({
    orderId: order?._id?.toString() || "",
    orderCode: order?.orderCode || orderCode,
    success: responseCode === "00" ? "true" : "false",
    vnp_ResponseCode: responseCode,
    vnp_TransactionNo: vnp_Params["vnp_TransactionNo"] || "",
    vnp_TransactionStatus: vnp_Params["vnp_TransactionStatus"] || "",
    vnp_BankCode: vnp_Params["vnp_BankCode"] || "",
    vnp_Amount: vnp_Params["vnp_Amount"] || "",
  })

  return `${config.frontendReturnUrl}?${query.toString()}`
}

// Nhận kết quả thanh toán từ VNPay, kiểm tra hợp lệ rồi cập nhật trạng thái đơn hàng.
// Luôn trả HTTP 200 với RspCode theo quy định của VNPay.
const getIpnResult = async (vnp_Params) => {
  if (!verifyParams(vnp_Params)) {
    return { RspCode: "97", Message: "Checksum failed" }
  }

  const orderCode = vnp_Params["vnp_TxnRef"]
  const rspCode = vnp_Params["vnp_ResponseCode"]
  const amount = Number(vnp_Params["vnp_Amount"]) / 100

  const order = await findOrderByPaymentRef(orderCode)
  if (!order) {
    return { RspCode: "01", Message: "Order not found" }
  }

  if (amount !== order.totalPrice) {
    return { RspCode: "04", Message: "Amount invalid" }
  }

  if (["paid", "failed"].includes(order.paymentStatus)) {
    return { RspCode: "02", Message: "This order has been updated to the payment status" }
  }

  const paymentStatus = resolvePaymentStatus({
    responseCode: rspCode,
    transactionStatus: vnp_Params["vnp_TransactionStatus"]
  })

  await settleOrderPayment({
    order: order,
    paymentStatus: paymentStatus,
    logMeta: {
      action: "vnpay_ipn",
      message: `VNPay IPN update for order ${order.orderCode}`,
      context: { orderCode, paymentStatus: paymentStatus }
    }
  })

  return { RspCode: "00", Message: "Success" }
}

// Tạo lại paymentUrl cho đơn VNPay chưa thanh toán thành công (trong vòng 24h)
const payAgain = async ({ orderId, userId, ipAddr }) => {
  if (!orderId) throw httpError(400, "Thiếu mã đơn hàng")

  const order = await Order.findOne({ _id: orderId, user_id: userId, deleted: false })
  if (!order) throw httpError(404, "Không tìm thấy đơn hàng")

  if (order.paymentMethod !== "vnpay") {
    throw httpError(400, "Đơn hàng này không hỗ trợ thanh toán VNPay")
  }

  if (!["pending", "failed"].includes(order.paymentStatus)) {
    throw httpError(400, "Đơn hàng không ở trạng thái cần thanh toán lại")
  }

  if (order.status !== "pending") {
    throw httpError(400, "Đơn hàng đã không còn hoạt động để thanh toán lại")
  }

  if (Date.now() - new Date(order.createdAt).getTime() > PAY_AGAIN_WINDOW_MS) {
    throw httpError(400, "Liên kết thanh toán đã hết hạn, vui lòng đặt đơn mới")
  }

  // Đưa đơn về trạng thái "chờ thanh toán" mỗi lần bấm thanh toán lại
  order.paymentStatus = "pending"

  // Mỗi lần thanh toán lại phải sinh vnp_TxnRef mới (VNPay yêu cầu không trùng trong ngày)
  const txnRef = `${order.orderCode}-${Date.now().toString().slice(-10)}`
  order.paymentRefs = [...(order.paymentRefs || []), txnRef]
  await order.save()

  // Trừ các sản phẩm đã đặt khỏi giỏ (đề phòng user đã re-add hàng trong lúc bỏ dở thanh toán,
  // tránh mua trùng). Lỗi ở bước này không được chặn việc tạo giao dịch mới.
  try {
    await removeOrderedItemsFromCart(order)
  } catch (error) {
    logger.error("VNPay pay again: xóa sản phẩm khỏi giỏ thất bại", {
      category: "payment",
      action: "vnpay_pay_again",
      orderCode: order.orderCode,
      error: error.message,
    })
  }

  const paymentUrl = buildPaymentUrl({
    amount: order.totalPrice,
    orderCode: txnRef,
    returnUrl: process.env.VNP_RETURN_URL,
    ipAddr: ipAddr,
    locale: "vn",
  })

  logAction("payment", "vnpay_pay_again", `VNPay pay again for order ${order.orderCode}`, {
    orderCode: order.orderCode,
    orderId: orderId
  })

  return { paymentUrl: paymentUrl }
}

module.exports = {
  getReturnRedirectUrl,
  getIpnResult,
  payAgain
}
