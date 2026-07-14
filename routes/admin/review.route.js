const express = require("express")
const router = express.Router()
const controller = require("../../controllers/admin/review.controller")

router.get("/", controller.index)
router.get("/:id", controller.detail)
router.delete("/:id", controller.deleteReview)

module.exports = router
