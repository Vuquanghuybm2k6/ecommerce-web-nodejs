const User = require("../../models/user.model")
const md5 = require("md5")
const ForgotPassword = require("../../models/forgot-password.model")
const generateHelper = require("../../helpers/generate")
const sendMailHelper = require("../../helpers/sendMail")
const Cart = require("../../models/cart.model")

// [GET]: /user/register
module.exports.register = (req, res) => {
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
    req.flash("success","Đăng kí tài khoản thành công")
    res.cookie("tokenUser", user.tokenUser)
  }
  res.redirect(req.get("Referer"))
}

// [GET]: /user/login
module.exports.login = (req, res) => {
  res.render("client/pages/user/login", {
    pageTitle: "Đăng nhập tài khoản",
  })
}

// [POST]: /user/login
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
  await Cart.updateOne({_id: req.cookies.cart}, {user_id: user.id})
  res.redirect("/")
}

// [GET]: /user/logout
module.exports.logout = (req, res) => {
  res.clearCookie("tokenUser")
  res.clearCookie("cartId")
  res.redirect("/")
}

// [GET]: /user/password/forgot
module.exports.forgotPassword = (req, res) => {
  res.render("client/pages/user/forgot-password",{
    pageTitle: "Lấy lại mật khẩu"
  }
  )
}

// [POST]: /user/password/forgot
module.exports.forgotPasswordPost = async (req, res) => {
  const email = req.body.email
  const user = await User.findOne({
    email: email,
    deleted: false
  })
  if(!user){
    req.flash("error", "Email không tồn tại")
    return res.redirect(req.get("Referer"))
  }
  // Tạo ra mã otp, và lưu nó vào trong db 
  await ForgotPassword.deleteMany({ email }) // chặn việc người dùng gửi email nhiều lần, khi đó sẽ tạo ra nhiều otp rác
  const otp = generateHelper.generateRandomNumber(6)
  const objectForgotPassword = {
    email: email,
    otp: otp,
    expiresAt: Date.now()
  }
  const forgotPassword = new ForgotPassword(objectForgotPassword)
  await forgotPassword.save()
  // Gửi mã otp đó qua email của người dùng
  const subject = `Mã OTP xác mình lấy lại mật khẩu`
  const html = `Mã OTP xác mình lấy lại mật khẩu là <b>${otp}</b>. Thời hạn sử dụng là 3 phút. Lưu ý không được để lộ mã OTP`
  sendMailHelper.sendMail(email,subject,html)
  res.redirect(`/user/password/otp?email=${email}`)
}

// [GET]: /user/password/otp
module.exports.otpPassword = async (req, res) => {
  const email = req.query.email
  res.render("client/pages/user/otp-password",{
    pageTitle: "Nhập mã otp",
    email: email
  }
  )
}

// [POST]: /user/password/otp
module.exports.otpPasswordPost = async (req, res) => {
  const email = req.body.email
  const otp = req.body.otp
  const result = await ForgotPassword.findOne({
    email: email,
    otp: otp
  })
  if(!result){
    req.flash("error", "OTP không đúng")
    return res.redirect(req.get("Referer"))
  }
  const user = await User.findOne({
    email: email,
    deleted: false
  })
  res.cookie("tokenUser", user.tokenUser)
  res.redirect(`/user/password/reset`)
}

// [GET]: /user/password/reset
module.exports.resetPassword = async (req, res) => {
  res.render("client/pages/user/reset-password",{
    pageTitle: "Đổi mật khẩu"
  }
  )
}

// [POST]: /user/password/reset
module.exports.resetPasswordPost = async (req, res) => {
  const password = req.body.password
  const tokenUser = req.cookies.tokenUser
  await User.updateOne({
    tokenUser: tokenUser
  },{
    password: md5(password)
  })
  req.flash("success", "Đổi mật khẩu thành công")
  res.redirect("/")
}

// [GET]: /user/info
module.exports.info = async (req, res) => {
  const email = req.query.email
  const tokenUser = req.cookies.tokenUser
  const user = await User.findOne({tokenUser: tokenUser}).select("-password -tokenUser")
  res.render("client/pages/user/info",{
    pageTitle: "Thông tin tài khoản",
    email: email,
    user: user
  }
  )
}