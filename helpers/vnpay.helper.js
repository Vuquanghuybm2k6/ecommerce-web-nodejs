const crypto = require("crypto")
const qs = require("qs")

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

function hashString(data, secret) {
  return crypto
    .createHmac('sha512', secret)
    .update(Buffer.from(data, 'utf-8'))
    .digest('hex')
}

module.exports.createPaymentUrl = (order, req) => {
  const pad = (n) => n.toString().padStart(2, '0')

  const date = new Date()
  const createDate =
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`

  const expire = new Date(date.getTime() + 15 * 60 * 1000)
  const expireDate =
    `${expire.getFullYear()}${pad(expire.getMonth() + 1)}${pad(expire.getDate())}` +
    `${pad(expire.getHours())}${pad(expire.getMinutes())}${pad(expire.getSeconds())}`

  const hashSecret = (process.env.VNP_HASH_SECRET || '').trim()

  const vnpParams = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: (process.env.VNP_TMN_CODE || '').trim(),
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: order.orderCode,
    vnp_OrderInfo: `Thanh_toan_DH${order.orderCode}`,
    vnp_OrderType: 'other',
    vnp_Amount: String(order.totalPrice * 100),
    vnp_ReturnUrl: (process.env.VNP_RETURN_URL || '').trim(),
    vnp_IpAddr: getIpAddr(req),
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  }

  const sorted = sortObject(vnpParams)
  const signData = Object.entries(sorted)
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
  const signed = hashString(signData, hashSecret)
  sorted.vnp_SecureHash = signed

  const paymentUrl = `${process.env.VNP_URL}?${qs.stringify(sorted)}`

  return paymentUrl
}

module.exports.verifyReturn = (query) => {
  const secureHash = query.vnp_SecureHash
  const clone = { ...query }
  delete clone.vnp_SecureHash
  delete clone.vnp_SecureHashType

  const sorted = sortObject(clone)
  const signData = Object.entries(sorted)
    .map(([k, v]) => `${k}=${v}`)
    .join('&')

  const hashSecret = (process.env.VNP_HASH_SECRET || '').trim()
  const signed = hashString(signData, hashSecret)
  const isValid = secureHash === signed

  return {
    isValid,
    responseCode: query.vnp_ResponseCode,
    transactionNo: query.vnp_TransactionNo,
    bankCode: query.vnp_BankCode,
    payDate: query.vnp_PayDate,
    txnRef: query.vnp_TxnRef,
    amount: parseInt(query.vnp_Amount) / 100,
  }
} 