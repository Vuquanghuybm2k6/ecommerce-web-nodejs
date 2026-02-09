const Role = require("../../models/role.model")
const systemConfig = require("../../config/system")
const paginationHelper = require("../../helpers/pagination")
// [GET]: /admin/roles
module.exports.index = async (req, res) => {
  const totalItem = await Role.countDocuments({deleted: false})
  const pagination = paginationHelper(req.query, totalItem, {
    currentPage: 1,
    limitItem: 4
  })
  const records = await Role
  .find({
    deleted: false
  })
  .limit(pagination.limitItem)
  .skip(pagination.skip)
  res.render("admin/pages/roles/index.pug", {
    pageTitle: "Danh sách nhóm quyền",
    records: records,
    pagination: pagination
  })
}
// [GET]: /admin/roles/create
module.exports.create = async (req, res) => {
  res.render("admin/pages/roles/create.pug", {
    pageTitle: "Tạo nhóm quyền",
  })
}
// [POST]: /admin/roles/create
module.exports.createPost = async (req, res) => {
  const record = new Role(req.body)
  await record.save()
  req.flash("success", "Tạo mới nhóm quyền thành công")
  res.redirect(`${systemConfig.prefixAdmin}/roles`)
}
// [PATCH]: /admin/roles/delete/:id
module.exports.delete = async (req, res) => {
  const id = req.params.id
  await Role.updateOne({
    _id: id
  }, {
    deleted: true
  })
  req.flash("success", "Xóa nhóm quyền thành công")
  res.redirect(`${systemConfig.prefixAdmin}/roles`)
}
// [GET]: /admin/roles/edit/:id
module.exports.edit = async (req, res) => {
  try {
    const id = req.params.id
    const data = await Role.findOne({
      _id: id
    }, {
      deleted: false
    })
    res.render("admin/pages/roles/edit.pug", {
      pageTitle: "Chỉnh sửa nhóm quyền",
      data: data
    })
  } catch (error) {
    res.redirect(`${systemConfig.prefixAdmin}/roles`)
  }
}
// [PATCH]: /admin/roles/delete/:id
module.exports.editPatch = async (req, res) => {
  try {
    const id = req.params.id
    await Role.updateOne({
      _id: id
    }, req.body)
    req.flash("success", "Cập nhật nhóm quyền thành công")
  } catch (error) {
    req.flash("error", "Cập nhật nhóm quyền thất bại")

  }
  res.redirect(req.get("Referer"))
}
// [GET]: /admin/roles/permissions
module.exports.permissions = async (req, res) => {
  try {
  let find = {
    deleted: false
  }
  const records = await Role.find(find)
    res.render("admin/pages/roles/permissions.pug", {
      pageTitle: "Phân quyền",
      records: records
    })
  } catch (error) {
    res.redirect(`${systemConfig.prefixAdmin}/roles`)
  }
}
// [PATCH]: /admin/roles/permissions
module.exports.permissionsPatch = async (req, res) => {
  const permissions = JSON.parse(req.body.permissions)
  console.log(permissions)
  for(const item of permissions){
    await Role.updateOne({_id: item.id}, {permissions: item.permissions})
  }
  req.flash("success","Cập nhật phân quyền thành công")
  res.redirect(req.get("Referer"))
}