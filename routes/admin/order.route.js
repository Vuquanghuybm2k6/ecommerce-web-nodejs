const express = require("express")
const router = express.Router()
const controller = require("../../controllers/admin/order.controller")
const { requirePermission } = require("../../middlewares/admin/auth.middleware")

router.get("/", requirePermission('orders_view'), controller.index)
router.get("/detail/:id", requirePermission('orders_view'), controller.detail)
router.patch("/change-status/:id", requirePermission('orders_edit'), controller.changeStatus)
router.patch("/delete/:id", requirePermission('orders_delete'), controller.delete)

module.exports = router
