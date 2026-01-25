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
  await Role.updateOne({_id:id}, {deleted: true})
  req.flash("success", "Xóa nhóm quyền thành công")
  res.redirect(`${systemConfig.prefixAdmin}/roles`)
}