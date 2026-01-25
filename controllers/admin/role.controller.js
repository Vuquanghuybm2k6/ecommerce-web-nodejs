const Role = require("../../models/role.model")
const systemConfig = require("../../config/system")
// [GET]: /admin/roles
module.exports.index = async (req, res) => {
  const records = await Role.find({
    deleted: false
  })
  res.render("admin/pages/roles/index.pug", {
    pageTitle: "Danh sách nhóm quyền",
    records: records
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