const express = require("express")
const router = express.Router()
const controller = require("../../controllers/admin/product.controller")
const multer = require("multer")
const upload = multer()
const uploadCloud = require("../../middlewares/admin/uploadCoud")
const validate = require("../../validates/admin/product.validate")
const { requirePermission } = require("../../middlewares/admin/auth.middleware")
router.get("/", requirePermission('products_view'), controller.index)
router.patch("/change-status/:status/:id", requirePermission('products_edit'), controller.changeStatus)
router.patch("/change-multi", requirePermission('products_edit'), controller.changeMulti)
router.patch("/delete/:id", requirePermission('products_delete'), controller.delete)
router.get("/create", requirePermission('products_create'), controller.create)
router.post(
  "/create",
  upload.fields([{ name: 'variantThumbnail', maxCount: 50 }]),
  uploadCloud.upload,
  validate.createPost,
  controller.createPost)
router.get("/edit/:id", requirePermission('products_edit'), controller.edit)
router.patch("/edit/:id", requirePermission('products_edit'),
  upload.fields([{ name: 'variantThumbnail', maxCount: 50 }]),
  uploadCloud.upload,
  validate.editPatch,
  controller.editPatch)
router.get("/detail/:id", requirePermission('products_view'), controller.detail)
router.get("/update-position/:id/:position", requirePermission('products_edit'), controller.update)
module.exports = router