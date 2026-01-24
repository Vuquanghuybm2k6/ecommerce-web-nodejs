const express = require("express")
const router = express.Router()
const controller = require("../../controllers/admin/product-category.controller")
const uploadCloud = require("../../middlewares/admin/uploadCoud.js")
const multer = require("multer")
const upload = multer()
const validate = require("../../validates/admin/product-category.validate")
router.get("/", controller.index)
router.get(
  "/create",
  controller.create
)
router.post(
  "/create",
  upload.single("thumbnail"),
  validate.create,
  uploadCloud.upload,
  controller.createPost)
router.get("/edit/:id", controller.edit)
router.patch(
  "/edit/:id",
  upload.single("thumbnail"),
  validate.create,
  uploadCloud.upload,
  controller.editPatch)
module.exports = router