const rateLimit = require('express-rate-limit')

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { code: 429, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau' },
  standardHeaders: true,
  legacyHeaders: false,
})

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { code: 429, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau' },
  standardHeaders: true,
  legacyHeaders: false,
})

module.exports = { authLimiter, generalLimiter }
