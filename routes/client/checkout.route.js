const express = require("express")
const router = express.Router()
const controller= require("../../controllers/client/checkout.controller")
const validate = require("../../validates/client/checkout.validate")
router.get("/",validate.index,controller.index)
router.post("/order",validate.order,controller.order)
router.get("/success/:orderId",controller.success)
module.exports =router