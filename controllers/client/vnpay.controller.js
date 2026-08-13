const Order = require("../../models/order.model")
const Cart = require("../../models/cart.model")
const { config, verifyParams } = require("../../helpers/vnpay")
const { applyOrderToCart } = require("../../helpers/cart")
const { logAction, logger } = require("../../helpers/logger")

const PAY_AGAIN_WINDOW_MS = 24 * 60 * 60 * 1000

// Sau khi thanh toán thành công, trừ các mặt hàng đã đặt khỏi giỏ hiện tại
// để tránh user mua trùng nếu đã re-add hàng vào giỏ trước đó.
async function removeOrderedItemsFromCart(order) {
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

// [GET]: /api/checkout/vnpay-return
// Redirect từ VNPay sau khi user hoàn tất thanh toán.
// Cập nhật paymentStatus trong DB như phương án dự phòng, vì IPN (server-to-server)
// chỉ chạy khi backend có URL công khai và được đăng ký ở cổng VNPay.
module.exports.vnpayReturn = async (req, res) => {
  const vnp_Params = req.query

  if (!verifyParams(vnp_Params)) {
    return res.redirect(`${config.frontendReturnUrl}?success=false&message=invalid_signature`)
  }

  const orderCode = vnp_Params["vnp_TxnRef"] || ""
  const order = await Order.findOne({
    $or: [{ paymentRefs: orderCode }, { orderCode }]
  })
  const responseCode = vnp_Params["vnp_ResponseCode"] || ""
  const txnStatus = vnp_Params["vnp_TransactionStatus"] || ""

  const isSuccess = responseCode === "00"
  // Mã 01 (giao dịch chưa hoàn tất) = khách mất điện/thoát giữa trang thanh toán → vẫn chờ thanh toán
  const isIncomplete = txnStatus === "01"
  const newStatus = isSuccess ? "paid" : (isIncomplete ? "pending" : "failed")

  if (order) {
    try {
      // Guard idempotent: không ghi đè trạng thái cuối (paid/failed) đã có từ IPN,
      // tránh race nếu IPN chạy cùng lúc.
      const updated = await Order.findOneAndUpdate(
        {
          _id: order._id,
          paymentStatus: { $nin: ["paid", "failed"] },
        },
        { $set: { paymentStatus: newStatus } },
        { new: true }
      )

      if (isSuccess && updated) {
        await removeOrderedItemsFromCart(order)
      }

      logAction("payment", "vnpay_return", `VNPay return for order ${order.orderCode}`, {
        orderCode: order.orderCode,
        responseCode,
        txnStatus,
        paymentStatus: newStatus,
        updated: !!updated,
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

  res.redirect(`${config.frontendReturnUrl}?${query.toString()}`)
}

// [GET]: /api/checkout/vnpay-ipn
// Hàm này có nhiệm vụ nhận kết quả thanh toán từ vnpay, ktra nó có hợp lệ hay k rồi cập nhật trạng thái đơn hàng
module.exports.vnpayIpn = async (req, res) => {
  const vnp_Params = req.query

  if (!verifyParams(vnp_Params)) {
    return res.status(200).json({ RspCode: "97", Message: "Checksum failed" })
  }

  const orderCode = vnp_Params["vnp_TxnRef"]
  const rspCode = vnp_Params["vnp_ResponseCode"]
  const amount = Number(vnp_Params["vnp_Amount"]) / 100

  const order = await Order.findOne({
    $or: [{ paymentRefs: orderCode }, { orderCode }]
  })
  if (!order) {
    return res.status(200).json({ RspCode: "01", Message: "Order not found" })
  }

  if (amount !== order.totalPrice) {
    return res.status(200).json({ RspCode: "04", Message: "Amount invalid" })
  }

  if (order.paymentStatus === "paid" || order.paymentStatus === "failed") {
    return res.status(200).json({ RspCode: "02", Message: "This order has been updated to the payment status" })
  }

  const isSuccess = rspCode === "00"
  // Mã 01 (giao dịch chưa hoàn tất) = khách mất điện/thoát giữa trang thanh toán → vẫn chờ thanh toán
  const isIncomplete = vnp_Params["vnp_TransactionStatus"] === "01"
  order.paymentStatus = isSuccess ? "paid" : (isIncomplete ? "pending" : "failed")
  await order.save()

  if (isSuccess) {
    await removeOrderedItemsFromCart(order)
  }

  logger.info("VNPay IPN update", {
    category: "payment",
    action: "vnpay_ipn",
    orderCode,
    paymentStatus: order.paymentStatus,
  })

  return res.status(200).json({ RspCode: "00", Message: "Success" })
}

// [POST]: /api/checkout/pay-again
// Tạo lại paymentUrl cho đơn VNPay chưa thanh toán thành công (trong vòng 24h)
module.exports.payAgain = async (req, res) => {
  const orderId = req.body.orderId
  if (!orderId) {
    return res.status(400).json({ code: 400, message: "Thiếu mã đơn hàng" })
  }

  const order = await Order.findOne({ _id: orderId, user_id: req.user.id, deleted: false })
  if (!order) {
    return res.status(404).json({ code: 404, message: "Không tìm thấy đơn hàng" })
  }

  if (order.paymentMethod !== "vnpay") {
    return res.status(400).json({ code: 400, message: "Đơn hàng này không hỗ trợ thanh toán VNPay" })
  }

  if (!["pending", "failed"].includes(order.paymentStatus)) {
    return res.status(400).json({ code: 400, message: "Đơn hàng không ở trạng thái cần thanh toán lại" })
  }

  if (order.status !== "pending") {
    return res.status(400).json({ code: 400, message: "Đơn hàng đã không còn hoạt động để thanh toán lại" })
  }

  if (Date.now() - new Date(order.createdAt).getTime() > PAY_AGAIN_WINDOW_MS) {
    return res.status(400).json({ code: 400, message: "Liên kết thanh toán đã hết hạn, vui lòng đặt đơn mới" })
  }

  const { buildPaymentUrl, getClientIp } = require("../../helpers/vnpay")

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
    ipAddr: getClientIp(req),
    locale: "vn",
  })

  logger.info("VNPay pay again", {
    category: "payment",
    action: "vnpay_pay_again",
    orderCode: order.orderCode,
    orderId,
  })

  return res.status(200).json({ code: 200, message: "Thành công", data: { paymentUrl } })
}
