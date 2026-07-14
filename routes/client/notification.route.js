const express = require("express")
const router = express.Router()
const controller = require("../../controllers/client/notification.controller")
const authMiddleware = require("../../middlewares/client/auth.middleware")

router.get("/", authMiddleware.requireAuth, controller.index)
router.get("/count", authMiddleware.requireAuth, controller.count)
router.patch("/read-all", authMiddleware.requireAuth, controller.markAllRead)
router.patch("/:id/read", authMiddleware.requireAuth, controller.markRead)

module.exports = router
