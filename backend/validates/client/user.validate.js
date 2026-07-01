module.exports.registerPost = (req, res, next) =>{
  if(!req.body.fullName){
    return res.status(400).json({
      code: 400,
      message: "Vui lòng nhập họ tên"
    })
  }
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
module.exports.loginPost = (req, res, next) =>{
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
module.exports.forgotPasswordPost = (req, res, next) =>{
  if(!req.body.email){
    return res.status(400).json({
      code: 400,
      message: "Vui lòng nhập email"
    })
  }
  next()
}
module.exports.otpPasswordPost = (req, res, next) =>{
  if(!req.body.otp){
    return res.status(400).json({
      code: 400,
      message: "Vui lòng nhập mã otp"
    })
  }
  next()
}
module.exports.resetPasswordPost = (req,res,next) =>{
  if(!req.body.password){
    return res.status(400).json({
      code: 400,
      message: "Mật khẩu không được để trống!"
    })
  }
  if(!req.body.confirmPassword){
    return res.status(400).json({
      code: 400,
      message: "Vui lòng xác nhận lại mật khẩu!"
    })
  }
  if(req.body.password != req.body.confirmPassword){
    return res.status(400).json({
      code: 400,
      message: "Xác nhận mật khẩu không trùng khớp"
    })
  }
  next();
}
module.exports.editPatch = (req,res,next) =>{
    if(!req.body.fullName){
    return res.status(400).json({
      code: 400,
      message: "Vui lòng nhập họ tên"
    })
  }
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
