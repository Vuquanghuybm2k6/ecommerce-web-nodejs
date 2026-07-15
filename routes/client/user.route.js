const express = require("express")
const router = express.Router()
const controller= require("../../controllers/client/user.controller")
const validate = require("../../validates/client/user.validate")
const multer = require("multer")
const upload = multer()
const uploadCloud = require("../../middlewares/admin/uploadCoud")
const { authLimiter, generalLimiter } = require("../../middlewares/rateLimiter")
router.get("/register", controller.register)
router.post(
  "/register",
  authLimiter,
  upload.single("avatar"),
  uploadCloud.upload,
  validate.registerPost,
  controller.registerPost)
router.get("/login", controller.login)
router.post("/login", authLimiter, validate.loginPost, controller.loginPost)
router.post("/refresh-token", generalLimiter, controller.refreshToken)
router.post("/logout", controller.logout)
router.get("/password/forgot", controller.forgotPassword)
router.post("/password/forgot", authLimiter, validate.forgotPasswordPost, controller.forgotPasswordPost)
router.get("/password/otp", controller.otpPassword)
router.post("/password/otp", authLimiter, validate.otpPasswordPost, controller.otpPasswordPost)
router.get("/password/reset", controller.resetPassword)
router.post("/password/reset", authLimiter, validate.resetPasswordPost, controller.resetPasswordPost)
router.get("/info", controller.info)
router.get("/edit", controller.edit)
router.patch(
  "/edit", 
  upload.single("avatar"),
  validate.editPatch,
  uploadCloud.upload,
  controller.editPatch)
module.exports = router