module.exports.loginPost = (req,res,next) =>{
  if(!req.body.email){
    return res.status(400).json({
      code: 400,
      message: "Vui lòng nhập email"
    })
  }
  if(!req.body.password){
    return res.status(400).json({
      code: 400,
      message: "Vui lòng nhập mật khẩu"
    })
  }
  next()
}
