const express = require("express")
const router = express.Router()
const controller = require("../../controllers/admin/account.controller")
const multer = require("multer")
const upload = multer()
const uploadCloud = require("../../middlewares/admin/uploadCoud")
const validate = require("../../validates/admin/account.validate")
router.get("/", controller.index)
router.get("/create", controller.create)
router.post(
  "/create", 
  upload.single("avatar"),
  validate.createPost,
  uploadCloud.upload,
  controller.createPost)
router.get("/edit/:id", controller.edit)
router.patch(
  "/edit/:id", 
  upload.single("avatar"),
  validate.editPatch,
  uploadCloud.upload,
  controller.editPatch)
router.get("/detail/:id", controller.detail)
router.patch("/delete/:id", controller.delete)
router.patch("/change-status/:status/:id", controller.changeStatus)
module.exports = router