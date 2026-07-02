const express = require("express")
const router = express.Router()
const controller= require("../../controllers/client/cart.controller")
const validate = require("../../validates/client/cart.validate")
router.get("/",controller.index)
router.post("/add/:productId",validate.addPost,controller.addPost)
router.get("/delete/:productId",controller.delete)
router.get("/update/:productId/:quantity",validate.update,controller.update)
module.exports = router