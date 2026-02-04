const User = require("../../models/user.model")
const md5 = require("md5")
// [GET]: /user/register
module.exports.register = async (req, res) => {
  res.render("client/pages/user/register", {
    pageTitle: "Đăng kí tài khoản",
  })
}
// [POST]: /user/register
module.exports.registerPost = async (req, res) => {
  const emailExit = await User.findOne({email: req.body.email, deleted: false})
  if(emailExit){
    req.flash("error","Email này đã tồn tại")
    return res.redirect(req.get("Referer"))
  }
  else{
    req.body.password = md5(req.body.password)
    const user = new User(req.body)
    await user.save()
    res.cookie("tokenUser", user.tokenUser)
  }

}
// [GET]: /user/login
module.exports.login = async (req, res) => {
  res.render("client/pages/user/login", {
    pageTitle: "Đăng nhập tài khoản",
  })
}
// [POST]: /user/register
module.exports.loginPost = async (req, res) => {
  const email = req.body.email
  const password = md5(req.body.password)
  const user = await User.findOne({email:email, deleted: false})
  if(!user){
    req.flash("error","Email không tồn tại")
    return res.redirect(req.get("Referer"))
  }
  if(user.password != password){
    req.flash("error","Sai mật khẩu")
    return res.redirect(req.get("Referer"))
  }
  if(user.status == "inactive"){
    req.flash("error","Tài khoản hiện đang bị khóa")
    return res.redirect(req.get("Referer"))
  }
  res.cookie("tokenUser",user.tokenUser)
  res.redirect("/")
}
// [GET]: /user/logout
module.exports.logout = async (req, res) => {
  res.clearCookie("tokenUser")
  res.redirect("/")
}