const express = require("express")
const router = express.Router()
const controller= require("../../controllers/client/user.controller")
const validate = require("../../validates/client/user.validate")
const authMiddleware = require("../../middlewares/client/auth.middleware")
const multer = require("multer")
const upload = multer()
const uploadCloud = require("../../middlewares/admin/uploadCoud")
router.get("/register", controller.register)
router.post(
  "/register",
  validate.registerPost,
  upload.single("avatar"),
  uploadCloud.upload,
  controller.registerPost)
router.get("/login", controller.login)
router.post("/login", validate.loginPost, controller.loginPost)
router.get("/logout", controller.logout)
router.get("/password/forgot", controller.forgotPassword)
router.post("/password/forgot", validate.forgotPasswordPost, controller.forgotPasswordPost)
router.get("/password/otp", controller.otpPassword)
router.post("/password/otp", validate.otpPasswordPost, controller.otpPasswordPost)
router.get("/password/reset", controller.resetPassword)
router.post("/password/reset", validate.resetPasswordPost, controller.resetPasswordPost)
router.get("/info", authMiddleware.requireAuth, controller.info)
router.get("/edit", controller.edit)
router.patch(
  "/edit", 
  upload.single("avatar"),
  validate.editPatch,
  uploadCloud.upload,
  controller.editPatch)
module.exports = router