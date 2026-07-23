const Redis = require('ioredis')
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  username: process.env.REDIS_USER || '',
  password: process.env.REDIS_PASSWORD || '',
  // Nếu có password: password: process.env.REDIS_PASSWORD
})
module.exports = redis