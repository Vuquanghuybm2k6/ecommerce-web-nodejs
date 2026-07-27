const express = require("express")
const router = express.Router()
const controller = require("../../controllers/admin/review.controller")
const { requirePermission } = require("../../middlewares/admin/auth.middleware")

router.get("/", requirePermission('reviews_view'), controller.index)
router.get("/:id", requirePermission('reviews_view'), controller.detail)
router.delete("/:id", requirePermission('reviews_delete'), controller.deleteReview)

module.exports = router
