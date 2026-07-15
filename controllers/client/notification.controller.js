const Notification = require("../../models/notification.model")
const paginationHelper = require("../../helpers/pagination")
const { logger } = require("../../helpers/logger")

// [GET] /api/notifications
module.exports.index = async (req, res) => {
  try {
    const userId = req.user.id
    const find = { user_id: userId }

    const totalNotifications = await Notification.countDocuments(find)
    const pagination = paginationHelper(req.query, totalNotifications, {
      currentPage: 1,
      limitItem: 10
    })

    const notifications = await Notification.find(find)
      .limit(pagination.limitItem)
      .skip(pagination.skip)
      .sort({ createdAt: -1 })
      .lean()

    res.json({
      code: 200,
      message: "Thành công",
      data: { notifications, pagination }
    })
  } catch (error) {
    logger.error('Lỗi lấy thông báo', { error: error.message, stack: error.stack })
    res.status(400).json({ code: 400, message: "Lỗi lấy thông báo" })
  }
}

// [PATCH] /api/notifications/:id/read
module.exports.markRead = async (req, res) => {
  try {
    const userId = req.user.id
    const id = req.params.id

    await Notification.updateOne(
      { _id: id, user_id: userId },
      { $set: { read: true } }
    )

    res.json({
      code: 200,
      message: "Đã đánh dấu đã đọc"
    })
  } catch (error) {
    logger.error('Lỗi đánh dấu đã đọc', { error: error.message, stack: error.stack })
    res.status(400).json({ code: 400, message: "Lỗi" })
  }
}

// [PATCH] /api/notifications/read-all
module.exports.markAllRead = async (req, res) => {
  try {
    const userId = req.user.id

    await Notification.updateMany(
      { user_id: userId, read: false },
      { $set: { read: true } }
    )

    res.json({
      code: 200,
      message: "Đã đánh dấu tất cả đã đọc"
    })
  } catch (error) {
    logger.error('Lỗi đánh dấu tất cả đã đọc', { error: error.message, stack: error.stack })
    res.status(400).json({ code: 400, message: "Lỗi" })
  }
}

// [GET] /api/notifications/count
module.exports.count = async (req, res) => {
  try {
    const userId = req.user.id

    const unreadCount = await Notification.countDocuments({
      user_id: userId,
      read: false
    })

    res.json({
      code: 200,
      message: "Thành công",
      data: { unreadCount }
    })
  } catch (error) {
    logger.error('Lỗi đếm thông báo', { error: error.message, stack: error.stack })
    res.status(400).json({ code: 400, message: "Lỗi" })
  }
}
