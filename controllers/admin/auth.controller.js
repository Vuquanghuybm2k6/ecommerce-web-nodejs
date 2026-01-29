const Account = require("../../models/account.model")
const systemConfig = require("../../config/system")
const md5 = require("md5")
// [GET]: /admin/auth/login
module.exports.login = async (req, res) => {
  if (req.cookies.token) { // nếu người dùng đã đăng nhập và cố tình truy cập đến trang đăng nhập thì ta sẽ kiểm tra token của họ xem có trong cookie ko
    const user = await Account.findOne({ // nếu có thì kiểm tra xem token đấy có hợp lệ k bởi vì người dùng có thể thay đổi cookie
      token: req.cookies.token,
      deleted: false,
      status: "active"
    })
    if (user) {
      return res.redirect(`${systemConfig.prefixAdmin}/dashboard`)
    } else { // không hợp lệ thì xóa token trong cookie luôn
      res.clearCookie("token")
    }
  }
  res.render("admin/pages/auth/login", {
    pageTitle: "Trang đăng nhập"
  })
}
// [POST]: /admin/auth/login
module.exports.loginPost = async (req, res) => {
  const email = req.body.email
  const password = req.body.password
  const user = await Account.findOne({
    email: email,
    deleted: false
  })
  if (!user) {
    req.flash("error", "Email không tồn tại")
    res.redirect(req.get("Referer"))
    return
  } else {
    if (md5(password) != user.password) {
      req.flash("error", "Sai mật khẩu")
      res.redirect(req.get("Referer"))
      return
    } else {
      if (user.status == "inactive") {
        req.flash("error", "Tài khoản này hiện đang bị khóa")
        res.redirect(req.get("Referer"))
        return
      } else {
        res.cookie("token", user.token)
        res.redirect(`${systemConfig.prefixAdmin}/dashboard`)
      }
    }
  }
}
// [GET]: /admin/auth/login
module.exports.logout = async (req, res) => {
  res.clearCookie("token")
  res.redirect(`${systemConfig.prefixAdmin}/auth/login`)
}