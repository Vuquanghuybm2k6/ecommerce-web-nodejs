const Account = require("../../models/account.model")
const Role = require("../../models/role.model")
const md5 = require("md5")
const systemConfig = require("../../config/system")
const paginationHelper = require("../../helpers/pagination")
const searchHelper = require("../../helpers/search")
// [GET]: /admin/accounts
module.exports.index = async (req, res) => {
  const find = {
    deleted: false
  }

  // Search
  if(req.query.keyword){
    const regex = searchHelper(req.query)
    find.fullName = regex
  }
  // End Search

  // Pagination
  const totalItem = await Account.countDocuments(find)
  const pagination = paginationHelper(req.query, totalItem, {
    currentPage: 1,
    limitItem: 4
  })
  // End Pagination

  const records = await Account
  .find(find)
  .select("-password -token") // loại bỏ những trường không muốn gửi ra bên fe
  .limit(pagination.limitItem)
  .skip(pagination.skip)
  for (const record of records) {
    const role = await Role.findOne({
      _id: record.role_id,
      deleted: false
    })
    record.role = role
  }
  res.render("admin/pages/accounts/index", {
    pageTitle: "Danh sách tài khoản",
    records: records,
    pagination: pagination
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
  try {
    const id = req.params.id
    const account = await Account.findOne({
      _id: id,
      deleted: false
    }).select("-password -token")
    const roles = await Role.find({
      deleted: false
    })
    res.render("admin/pages/accounts/edit", {
      pageTitle: "Chỉnh sửa tài khoản",
      account: account,
      roles: roles
    })
  } catch (error) {
    res.redirect(`${systemConfig.prefixAdmin}/accounts`)
  }
}
// [PATCH]: /admin/accounts/edit
module.exports.editPatch = async (req, res) => {
  const id = req.params.id
  const emailExit = await Account.findOne({
    _id: {
      $ne: id
    }, // khi mà chỉnh sửa thì ta phải loại trừ cái email của chính bản thân ra, tìm email k phải của mình để check
    email: req.body.email,
    deleted: false
  })
  if (emailExit) {
    req.flash("error", `Email ${req.body.email} đã tồn tại`)
  } else {
    if (req.body.password) {
      req.body.password = md5(req.body.password)
    } else {
      delete req.body.password
    }
    await Account.updateOne({
      _id: id
    }, req.body)
    req.flash("success", "Cập nhật tài khoản thành công")
  }
  res.redirect(req.get("Referer"))
}
// [GET]: /admin/accounts/detail/:id
module.exports.detail = async (req, res) => {
  try {
    const id = req.params.id
    const account = await Account.findOne({
      _id: id,
      deleted: false
    }).select("-password -token")
    const roles = await Role.find({
      deleted: false
    })
    for (const role of roles) {
      if (account.role_id == role.id) {
        account.role = role.title
      }
    }
    res.render("admin/pages/accounts/detail", {
      pageTitle: "Chi tiết tài khoản",
      account: account,
    })
  } catch (error) {
    res.redirect(`${systemConfig.prefixAdmin}/accounts`)
  }
}
// [PATCH]: /admin/accounts/delete/:id
module.exports.delete = async (req, res) => {
  try {
    const id = req.params.id
    await Account.updateOne({
      _id: id
    }, {
      deleted: true,
      deletedAt: new Date()
    })
    req.flash("success", "Xóa tài khoản thành công")
  } catch (error) {
    req.flash("error", "Xóa tài khoản thất bại")
  }
  res.redirect(req.get("Referer"))

}
// [PATCH]: /admin/accounts/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {
  try {
    const id = req.params.id
    const status = req.params.status
    await Account.updateOne({
      _id: id
    }, {
      status: status
    })
    req.flash("success", "Cập nhật thành công")
  } catch (error) {
    req.flash("error", "Cập nhật thành công")
  }
  res.redirect(req.get("Referer"))

}