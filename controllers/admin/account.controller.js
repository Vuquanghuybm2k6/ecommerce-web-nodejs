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
// [GET]: /admin/accounts/edit
module.exports.edit = async (req, res) => {
  try{
    const id = req.params.id
  const account = await Account.findOne({_id:id, deleted:false}).select("-password -token")
  const roles = await Role.find({deleted:false})
  res.render("admin/pages/accounts/edit", {
    pageTitle: "Chỉnh sửa tài khoản",
    account: account,
    roles: roles
  })
  }
  catch(error){
    res.redirect(`${systemConfig.prefixAdmin}/accounts`)
  }
}
// [PATCH]: /admin/accounts/edit
module.exports.editPatch = async (req, res) => {
  const id = req.params.id
  const emailExit = await Account.findOne(
    {
      _id: {$ne: id}, // khi mà chỉnh sửa thì ta phải loại trừ cái email của chính bản thân ra, tìm email k phải của mình để check
      email: req.body.email,
      deleted: false
    }
  )
  if(emailExit){
    req.flash("error", `Email ${req.body.email} đã tồn tại`)
  }
  else{
    if(req.body.password){
      req.body.password = md5(req.body.password)
    }
    else{
      delete req.body.password
    }
    await Account.updateOne({_id:id}, req.body)
    req.flash("success", "Cập nhật tài khoản thành công")
  }
  res.redirect(req.get("Referer"))
}