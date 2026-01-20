const multer = require("multer")
module.exports = () => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/uploads') // đi đến thư mục lưu file đã upload
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) // random tạo chuỗi
      cb(null, `${uniqueSuffix}-${file.originalname}`) // lưu tên file 
    }
  })
  return storage
}