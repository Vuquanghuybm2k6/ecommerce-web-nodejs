module.exports.create = (req,res,next) =>{
  if(!req.body.title){
    return res.status(400).json({
      code: 400,
      message: "Vui lòng nhập lại tiêu đề"
    })
  }
  next()
}
