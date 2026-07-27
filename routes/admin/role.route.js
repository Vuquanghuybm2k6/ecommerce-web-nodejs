const express = require("express")
const router = express.Router()
const controller = require("../../controllers/admin/role.controller")
const validate = require("../../validates/admin/product.validate")
const { requirePermission } = require("../../middlewares/admin/auth.middleware")
router.get("/", requirePermission('roles_view'), controller.index)
router.get("/create", requirePermission('roles_create'), controller.create)
router.post(
  "/create", 
  validate.createPost,
  requirePermission('roles_create'),
  controller.createPost)
router.patch("/delete/:id", requirePermission('roles_delete'), controller.delete)
router.get("/edit/:id", requirePermission('roles_edit'), controller.edit)
router.patch("/edit/:id", requirePermission('roles_edit'), controller.editPatch)
router.get("/permissions", requirePermission('roles_permissions'), controller.permissions)
router.patch("/permissions", requirePermission('roles_permissions'), controller.permissionsPatch)
module.exports = router