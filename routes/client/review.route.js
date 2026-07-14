const express = require("express")
const router = express.Router()
const multer = require("multer")
const upload = multer()
const controller = require("../../controllers/client/review.controller")
const authMiddleware = require("../../middlewares/client/auth.middleware")
const validate = require("../../validates/client/review.validate")
const uploadCloud = require("../../middlewares/admin/uploadCoud")

router.get("/product/:productId", controller.index)
router.get("/user-review", authMiddleware.requireAuth, controller.userReview)
router.post("/", authMiddleware.requireAuth, validate.create, controller.create)
router.get("/user", authMiddleware.requireAuth, controller.myReviews)
router.post("/upload-images", authMiddleware.requireAuth, upload.array("images", 5), uploadCloud.uploadMultiple, controller.uploadImages)
router.patch("/:id", authMiddleware.requireAuth, validate.update, controller.update)
router.delete("/:id", authMiddleware.requireAuth, controller.delete)
router.post("/:id/helpful", authMiddleware.requireAuth, controller.helpful)

module.exports = router
  