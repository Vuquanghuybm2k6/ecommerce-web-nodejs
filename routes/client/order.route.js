const express = require("express")
const router = express.Router()
const controller = require("../../controllers/client/order.controller")
const authMiddleware = require("../../middlewares/client/auth.middleware")

router.get("/", authMiddleware.requireAuth, controller.index)
router.patch("/cancel/:orderId", authMiddleware.requireAuth, controller.cancel)
router.get("/:orderId", authMiddleware.requireAuth, controller.detail)

module.exports = router
