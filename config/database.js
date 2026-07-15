const mongoose = require("mongoose")
const { logger } = require("../helpers/logger")
module.exports.connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL)
    logger.info('Kết nối MongoDB thành công')

  } catch (error) {
    logger.error('Kết nối MongoDB thất bại', { error: error.message })
  }
}