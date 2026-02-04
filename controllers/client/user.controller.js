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