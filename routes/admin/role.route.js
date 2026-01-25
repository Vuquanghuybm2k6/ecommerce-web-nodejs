const express = require("express")
const router = express.Router()
const controller = require("../../controllers/admin/role.controller")
const validate = require("../../validates/admin/product.validate")
router.get("/", controller.index)
router.get("/create", controller.create)
router.post(
  "/create", 
  validate.createPost,
  controller.createPost)
module.exports = router