const winston = require('winston')
const path = require('path')
require('winston-daily-rotate-file')

const logDir = path.join(__dirname, '..', 'logs') // khai bao thư mục logs để lưu trữ các file log

const errorTransport = new winston.transports.DailyRotateFile({ // transport là nơi log sẽ được ghi vào, ở đây là file log error
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxFiles: '30d',
  zippedArchive: true, // tự đông nén các file log cũ thành file zip để tiết kiệm dung lượng
})

const combinedTransport = new winston.transports.DailyRotateFile({ // khong có level, nên sẽ log tất cả các level, ở đây là 
  filename: path.join(logDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  zippedArchive: true,
})

const consoleTransport = new winston.transports.Console({// transport ghi ra terminal console, chỉ dùng khi chạy ở môi trường dev
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
      return `${timestamp} [${level}]: ${message}${metaStr}`
    })
  ),
})

const logger = winston.createLogger({ // tao một logger với các transport đã khai báo ở trên, và định dạng log là json
  level: 'info', // khi đặt level là info thì chỉ ghi log ở info, warn, error và bỏ qua debug, verbose, silly
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [errorTransport, combinedTransport, consoleTransport], // một lần log sẽ được gửi tới 3 nơi nếu đạt level >= info
})

const logAction = (category, action, message, metadata = {}) => {
  logger.info(message, {
    category,
    action,
    ...metadata,
  })
}

module.exports = { logger, logAction }

// Thứ tự các mức mặc định của Winston là:

// error (0)
// warn  (1)
// info  (2)
// http  (3)
// verbose (4)
// debug (5)
// silly (6)