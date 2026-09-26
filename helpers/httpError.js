const httpError = (statusCode, message) => Object.assign(new Error(message), { statusCode })

// Chuẩn hóa lỗi bất kỳ thành status + body để controller chỉ cần res.status().json().
// Lỗi do httpError tạo thì lộ message cho client, lỗi nội bộ thì giấu message để không lộ chi tiết.
const toResponse = (error, fallbackMessage = "Lỗi") => {
  const statusCode = error.statusCode || 500
  return {
    statusCode,
    body: {
      code: statusCode,
      message: error.statusCode ? error.message : fallbackMessage
    }
  }
}

module.exports = httpError
module.exports.toResponse = toResponse
