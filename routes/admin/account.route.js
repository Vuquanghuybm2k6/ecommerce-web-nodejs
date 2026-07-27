const express = require("express")
const router = express.Router()
const controller = require("../../controllers/admin/account.controller")
const multer = require("multer")
const upload = multer()
const uploadCloud = require("../../middlewares/admin/uploadCoud")
const validate = require("../../validates/admin/account.validate")
const { requirePermission } = require("../../middlewares/admin/auth.middleware")
router.get("/", requirePermission('accounts_view'), controller.index)
router.get("/create", requirePermission('accounts_create'), controller.create)
router.post(
  "/create", 
  upload.single("avatar"),
  requirePermission('accounts_create'),
  validate.createPost,
  uploadCloud.upload,
  controller.createPost)
router.get("/edit/:id", requirePermission('accounts_edit'), controller.edit)
router.patch(
  "/edit/:id", 
  upload.single("avatar"),
  requirePermission('accounts_edit'),
  validate.editPatch,
  uploadCloud.upload,
  controller.editPatch)
router.get("/detail/:id", requirePermission('accounts_view'), controller.detail)
router.patch("/delete/:id", requirePermission('accounts_delete'), controller.delete)
router.patch("/change-status/:status/:id", requirePermission('accounts_edit'), controller.changeStatus)
module.exports = router