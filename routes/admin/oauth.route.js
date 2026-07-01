const express = require("express")
const router = express.Router()
const controller = require("../../controllers/admin/oauth.controller")

router.get("/google", controller.googleAuth)
router.get("/google/callback", controller.googleCallback)

module.exports = router
