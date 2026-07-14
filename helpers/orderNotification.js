const Notification = require("../models/notification.model")
const User = require("../models/user.model")
const sendMailHelper = require("../helpers/sendMail")

const statusLabels = {
  pending: "Chờ xác nhận",
  pending_vnpay: "Chờ thanh toán VNPay",
  payment_failed: "Thanh toán thất bại",
  confirmed: "Đã xác nhận",
  shipped: "Đang giao hàng",
  delivered: "Đã giao hàng",
  cancelled: "Đã hủy",
}

const getEmailContent = (order, newStatus, reason) => {
  const orderCode = order.orderCode || ""
  const total = (order.totalPrice || 0).toLocaleString("vi-VN")
  let subject, body

  switch (newStatus) {
    case "pending_vnpay":
      subject = `Đơn hàng ${orderCode} sẵn sàng thanh toán lại`
      body = `<p>Đơn hàng <b>${orderCode}</b> của bạn đã sẵn sàng để thanh toán lại qua VNPay.</p>
              <p>Vui lòng truy cập website và tiến hành thanh toán.</p>`
      break
    case "payment_failed":
      subject = `Đơn hàng ${orderCode} thanh toán thất bại`
      body = `<p>Thanh toán cho đơn hàng <b>${orderCode}</b> không thành công.</p>
              <p>Vui lòng kiểm tra lại thông tin hoặc thử phương thức thanh toán khác.</p>`
      break
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
      return null
  }

  return { subject, body }
}

module.exports.sendOrderNotification = async (order, newStatus, reason) => {
  if (!order.user_id) return

  const user = await User.findOne({ _id: order.user_id }).select("email")
  const statusLabel = statusLabels[newStatus] || newStatus
  const notifTitle = `Đơn hàng ${order.orderCode || ""}`
  const notifMessage = `Đơn hàng của bạn đã chuyển sang trạng thái: ${statusLabel}`
    + (reason ? ` (Lý do: ${reason})` : "")

  await Notification.create({
    user_id: order.user_id,
    type: "order_status_changed",
    title: notifTitle,
    message: notifMessage,
    related_id: order._id?.toString(),
  })

  if (!user?.email) return

  const emailContent = getEmailContent(order, newStatus, reason)
  if (emailContent) {
    sendMailHelper.sendMail(user.email, emailContent.subject, emailContent.body)
  }
}
