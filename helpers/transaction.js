const mongoose = require("mongoose")

// Bọc một khối thao tác trong transaction của mongodb.
// Lỗi sẽ được ném ra sau khi abort để controller xử lý, session luôn được end trong finally.
const runInTransaction = async (work) => {
  const session = await mongoose.startSession()
  session.startTransaction()
  try {
    const result = await work(session)
    await session.commitTransaction()
    return result
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
}

module.exports = { runInTransaction }
