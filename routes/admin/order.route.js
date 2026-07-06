const express = require("express")
const router = express.Router()
const controller = require("../../controllers/admin/order.controller")

router.get("/", controller.index)
router.get("/detail/:id", controller.detail)
router.patch("/change-status/:status/:id", controller.changeStatus)
router.patch("/delete/:id", controller.delete)

module.exports = router
