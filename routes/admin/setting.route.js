const express = require("express")
const router = express.Router()
const multer = require("multer")
const upload = multer()
const uploadCloud = require("../../middlewares/admin/uploadCoud")
const controller = require("../../controllers/admin/setting.controller")
const { requirePermission } = require("../../middlewares/admin/auth.middleware")
router.get("/general", requirePermission('settings_view'), controller.general)
router.patch(
    "/general",
    upload.single("logo"),
    requirePermission('settings_edit'),
    uploadCloud.upload,
    controller.generalPatch
    )
module.exports = router