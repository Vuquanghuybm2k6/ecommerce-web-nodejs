const crypto = require("crypto") // thư viện giúp mã hóa dữ liệu
const qs = require("qs") // thư viện giúp chuyển đổi object sang query string

function sortObject(obj) {
  const sorted = {}
  Object.keys(obj)
    .sort()
    .forEach(key => { sorted[key] = obj[key] })
  return sorted
}

function getIpAddr(req) {
  return req.headers['x-forwarded-for']
    || req.ip
    || req.socket?.remoteAddress
    || '127.0.0.1'
}

module.exports.createPaymentUrl = (order, req) => { // tạo url thanh toán vnpay
  const pad = (n) => n.toString().padStart(2, '0')

  const date = new Date()
  const createDate =
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`

  const expire = new Date(date.getTime() + 15 * 60 * 1000)
  const expireDate =
    `${expire.getFullYear()}${pad(expire.getMonth() + 1)}${pad(expire.getDate())}` +
    `${pad(expire.getHours())}${pad(expire.getMinutes())}${pad(expire.getSeconds())}`

  const vnpParams = { // đây là toàn bộ dữ liệu để gửi sang vnpay
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: process.env.VNP_TMN_CODE, // mã merchant
    vnp_Locale: 'vn', // ngôn ngữ hiển thị trên cổng thanht toán
    vnp_CurrCode: 'VND', // đơn vị tiền tệ
    vnp_TxnRef: order.orderCode, // mã đơn hàng
    vnp_OrderInfo: `Thanh toan don hang ${order.orderCode}`, // thông tin mô tả đơn hàng
    vnp_OrderType: 'other', // loại đơn hàng
    vnp_Amount: order.totalPrice * 100, // số tiền thanh toán
    vnp_ReturnUrl: process.env.VNP_RETURN_URL, // url mà vnpay sẽ trả về sau khi thanh toán
    vnp_IpAddr: getIpAddr(req), // địa chỉ ip người dùng
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  }

  const sorted = sortObject(vnpParams)
  const signData = qs.stringify(sorted, { encode: false }) // biến object thành chuỗi để mang chuỗi này đi ký vì hash chỉ làm việc 
  // trên dữ liệu dạng string hoặc bytes, encode: false là để không mã hóa các ký tự đặc biệt như dấu +, dấu =, dấu &... 
  // vì vnpay yêu cầu phải giữ nguyên các ký tự này 
  const hmac = crypto.createHmac('sha512', process.env.VNP_HASH_SECRET) // tạo chữ ký bằng thuật toán sha512 và chuỗi bí mật 
  // do vnpay cung cấp, chuỗi này chỉ vnpay và sever biết, khách hàng không biết
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex') // bước tạo chữ ký, đầu tiên chuyển chuỗi sang bytes, 
  // sau đó mã hóa và cuối cùng chuyển sang dạng hex để gửi sang vnpay
  sorted.vnp_SecureHash = signed // gán chữ ký vào dữ liệu gửi sang vnpay, vnpay sẽ dùng chuỗi bí mật của họ để 
  // tạo chữ ký và so sánh với chữ ký này, nếu trùng nhau thì dữ liệu không bị thay đổi

  return `${process.env.VNP_URL}?${qs.stringify(sorted, { encode: false })}`
}

module.exports.verifyReturn = (query) => { // xác thực dữ liệu trả về từ vnpay,
//  vnpay sẽ gửi lại toàn bộ dữ liệu mà chúng ta đã gửi sang,
  const secureHash = query.vnp_SecureHash
  const clone = { ...query }
  delete clone.vnp_SecureHash
  delete clone.vnp_SecureHashType

  const sorted = sortObject(clone)
  const signData = qs.stringify(sorted, { encode: false })
  const hmac = crypto.createHmac('sha512', process.env.VNP_HASH_SECRET)
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

  return {
    isValid: secureHash === signed,
    responseCode: query.vnp_ResponseCode,
    transactionNo: query.vnp_TransactionNo,
    bankCode: query.vnp_BankCode,
    payDate: query.vnp_PayDate,
    txnRef: query.vnp_TxnRef,
    amount: parseInt(query.vnp_Amount) / 100,
  }
} 