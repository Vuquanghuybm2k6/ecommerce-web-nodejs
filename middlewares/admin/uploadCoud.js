const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')
// Cloudinary
// Kết nối với cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET 
});
// End Cloudinary

function uploadFile(file) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      (error, result) => {
        if (result) resolve(result.secure_url)
        else reject(error)
      }
    )
    streamifier.createReadStream(file.buffer).pipe(stream)
  })
}

module.exports.upload = async (req, res, next) => {
  try {
    const variantFiles = req.files?.variantThumbnail || []

    if (variantFiles.length > 0) {
      req.body.variantThumbnails = await Promise.all(variantFiles.map(uploadFile))
    }

    next()
  } catch {
    res.status(500).json({ code: 500, message: "Upload ảnh thất bại" })
  }
}

module.exports.uploadUrl = async (url) => {
  try {
    const result = await cloudinary.uploader.upload(url)
    return result.secure_url
  } catch {
    return url // fallback giữ nguyên URL gốc nếu upload thất bại
  }
}

module.exports.uploadMultiple = (req, res, next) => {
  if (req.files && req.files.length > 0) {
    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "reviews" },
          (error, result) => {
            if (result) resolve(result.secure_url)
            else reject(error)
          }
        )
        streamifier.createReadStream(file.buffer).pipe(stream)
      })
    })

    Promise.all(uploadPromises)
      .then(urls => {
        req.body.images = urls
        next()
      })
      .catch(() => {
        res.status(500).json({ code: 500, message: "Upload ảnh thất bại" })
      })
  } else {
    req.body.images = []
    next()
  }
}