const express = require("express")
const router = express.Router()
const controller = require("../../controllers/admin/product-category.controller")
const uploadCloud = require("../../middlewares/admin/uploadCoud.js")
const multer = require("multer")
const upload = multer()
const validate = require("../../validates/admin/product-category.validate")
const { requirePermission } = require("../../middlewares/admin/auth.middleware")
router.get("/", requirePermission('category_view'), controller.index)
router.get(
  "/create",
  requirePermission('category_create'),
  controller.create
)
router.post(
  "/create",
  requirePermission('category_create'),
  upload.single("thumbnail"),
  validate.create,
  uploadCloud.upload,
  controller.createPost)
router.get("/edit/:id", requirePermission('category_edit'), controller.edit)
router.patch(
  "/edit/:id",
  requirePermission('category_edit'),
  upload.single("thumbnail"),
  validate.create,
  uploadCloud.upload,
  controller.editPatch)
router.get("/detail/:id", requirePermission('category_view'), controller.detail)
router.patch("/delete/:id", requirePermission('category_delete'), controller.delete)
module.exports = router