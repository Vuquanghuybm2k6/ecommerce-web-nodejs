const express = require("express")
const router = express.Router()
const controller = require("../../controllers/client/order.controller")
const authMiddleware = require("../../middlewares/client/auth.middleware")

router.get("/", authMiddleware.requireAuth, controller.index)
router.get("/:orderId", authMiddleware.requireAuth, controller.detail)

module.exports = router
