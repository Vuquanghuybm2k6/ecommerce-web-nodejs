const express = require("express")
const router = express.Router()
const controller= require("../../controllers/client/cart.controller")
const validate = require("../../validates/client/cart.validate")
router.get("/",controller.index)
router.post("/add/:productId",validate.addPost,controller.addPost)
router.delete("/delete/:productId",controller.delete)
router.put("/update/:productId",validate.update,controller.update)
module.exports = router