const Account = require("../../models/account.model")
const Role = require("../../models/role.model")
const md5 = require("md5")
const systemConfig = require("../../config/system")
// [GET]: /admin/accounts
module.exports.index = async (req, res) => {
  const records = await Account.find({
    deleted: false
  }).select("-password -token") // loại bỏ những trường không muốn gửi ra bên fe
  for (const record of records) {
    const role = await Role.findOne({
      _id: record.role_id,
      deleted: false
    })
    record.role = role
  }
  res.render("admin/pages/accounts/index", {
    pageTitle: "Danh sách tài khoản",
    records: records
  })
}
// [GET]: /admin/accounts/create
module.exports.create = async (req, res) => {
  const roles = await Role.find({
    deleted: false
  })
  res.render("admin/pages/accounts/create", {
    pageTitle: "Tạo mới tài khoản",
    roles: roles
  })
}
// [POST]: /admin/accounts/create
module.exports.createPost = async (req, res) => {
  const emailExit = await Account.findOne({
    email: req.body.email, 
    deleted: false
  })
  if (emailExit) {
    req.flash("error", `Email đã tồn tại`)
    res.redirect(req.get("Referer"))
  } else {
    req.body.password = md5(req.body.password)
    const record = new Account(req.body)
    await record.save()
    res.redirect(`${systemConfig.prefixAdmin}/accounts`)
  }
}