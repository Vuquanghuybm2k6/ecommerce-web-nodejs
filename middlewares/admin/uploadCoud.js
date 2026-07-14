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

module.exports.upload = (req, res, next) =>{
  if (req.file) { 
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    async function upload(req) {
 
      let result = await streamUpload(req);
      console.log(result.secure_url);
      console.log(req.file)
      req.body[req.file.fieldname] = result.secure_url 
      next();
    }
    upload(req); 
  } else {
    next(); 
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