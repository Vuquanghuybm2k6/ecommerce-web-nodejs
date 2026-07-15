const express = require("express")
const router = express.Router()
const controller = require("../../controllers/admin/auth.controller")
const validate = require("../../validates/admin/auth.validate")
const { authLimiter, generalLimiter } = require("../../middlewares/rateLimiter")
router.get("/login", controller.login)
router.post(
  "/login", 
  authLimiter,
  validate.loginPost,
  controller.loginPost
)
router.post("/refresh-token", generalLimiter, controller.refreshToken)
router.post("/logout", controller.logout)
module.exports = router