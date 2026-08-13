const crypto = require("crypto")
const qs = require("qs") // thư viện này dùng để chuyển object thành query string và ngược lại

const config = {
  tmnCode: process.env.VNP_TMN_CODE || "", // mã website tại VNPAY
  hashSecret: process.env.VNP_HASH_SECRET || "", // chuỗi bí mật để tạo chữ ký
  url: process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html", // url thanh toán của VNPAY
  returnUrl: process.env.VNP_RETURN_URL || "", // url trả về khi thanh toán xong, thông thường là url bên be vì nó cần ktra chữ kí và cập nhật đơn hàng
  frontendReturnUrl: process.env.VNP_FRONTEND_RETURN_URL || "", // url trả về khi thanh toán xong (frontend)
}

function sortObject(obj) {
  const sorted = {}
  const keys = Object.keys(obj).sort()
  keys.forEach((key) => {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+")
  })
  return sorted
}

function createSignedHash(data) {
  return crypto.createHmac("sha512", config.hashSecret)
    .update(Buffer.from(data, "utf-8"))
    .digest("hex")
}

function formatDate(date) {
  const d = new Date(date)
  const pad = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

function getClientIp(req) {
  return (
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    ""
  )
}

function buildPaymentUrl({ amount, orderCode, returnUrl = config.returnUrl, bankCode = "", locale = "vn", ipAddr }) {
  const createDate = formatDate(new Date())
  const expireDate = formatDate(new Date(Date.now() + 15 * 60 * 1000))

  const params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: config.tmnCode,
    vnp_Locale: locale, // ngôn ngữ
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderCode, // mã vận đơn
    vnp_OrderInfo: "Thanh toan don hang ma GD:" + orderCode, // mô tả nội dung thanh toán
    vnp_OrderType: "other",
    vnp_Amount: amount * 100,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  }
  if (bankCode) params.vnp_BankCode = bankCode

  const sorted = sortObject(params)
  const signData = qs.stringify(sorted, { encode: false })
  sorted.vnp_SecureHash = createSignedHash(signData)

  return config.url + "?" + qs.stringify(sorted, { encode: false })
}

function verifyParams(params) {
  const vnp_Params = { ...params }
  const secureHash = vnp_Params["vnp_SecureHash"]
  delete vnp_Params["vnp_SecureHash"]
  delete vnp_Params["vnp_SecureHashType"]

  const sorted = sortObject(vnp_Params)
  const signData = qs.stringify(sorted, { encode: false })

  return secureHash === createSignedHash(signData)
}

module.exports = {
  config,
  sortObject,
  buildPaymentUrl,
  verifyParams,
  getClientIp,
}
