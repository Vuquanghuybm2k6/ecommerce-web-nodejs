const User = require("../../models/user.model")
module.exports.requireAuth = async(req, res, next) =>{
  if(!req.cookies.tokenUser){
    res.redirect(`/user/login`)
    return
  }
  else{
    const user = await User.findOne({tokenUser: req.cookies.tokenUser})
    if(!user){
      res.redirect(`${systemConfig.prefixAdmin}/auth/login`)
      return
    }
    else{
      next()
    }
  }
}
