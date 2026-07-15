const express = require("express")
const router = express.Router()
const controller = require("../../controllers/client/oauth.controller")

router.get("/google", controller.googleAuth)
router.get("/google/callback", controller.googleCallback)
router.post("/exchange-code", controller.exchangeOAuthCode)

module.exports = router
