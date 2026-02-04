const ProductCategory = require("../../models/product-category.model")
const systemConfig = require("../../config/system")
const createTreeHelper = require("../../helpers/createTree")
const Account = require("../../models/account.model")
// [GET]: /admin/products-category
module.exports.index = async (req, res) => {
  const find = {
    deleted: false
  }
  const records = await ProductCategory.find(find).sort({
    position: "asc"
  })
  const newRecords = createTreeHelper.tree(records)
  for(const newRecord of newRecords){
    const user = await Account.findOne({_id: newRecord.createdBy.account_id})
    if(user){
      newRecord.fullName = user.fullName
    }
  }
  res.render("admin/pages/products-category/index.pug", {
    pageTitle: "Danh mục sản phẩm",
    records: newRecords
  })
}
// [GET]: /admin/products-category/create
module.exports.create = async (req, res) => {
  const find = {
    deleted: false
  }
  const records = await ProductCategory.find(find).sort({
    position: "asc"
  })
  const newRecords = createTreeHelper.tree(records)
  res.render("admin/pages/products-category/create", {
    pageTitle: "Tạo mới danh mục sản phẩm",
    records: newRecords
  })
}
// [POST]: /admin/products-category/create
module.exports.createPost = async (req, res) => {
  if (req.body.position !== "") {
    req.body.position = parseInt(req.body.position)
  } else {
    const countCategory = await ProductCategory.countDocuments({
      deleted: false
    })
    req.body.position = countCategory + 1
  }
  req.body.createdBy = { // lưu id người dùng vào trong accout_id từ biến user trong middleware
    account_id : res.locals.user.id
  }
  const record = new ProductCategory(req.body)
  await record.save()
  req.flash("success", "Tạo mới danh mục sản phẩm thành công")
  res.redirect(`${systemConfig.prefixAdmin}/products-category`)
}
// [GET]: /admin/products-category/edit/:id
module.exports.edit = async (req, res) => {
  try {
    const find = {
      deleted: false
    }
    const records = await ProductCategory.find(find).sort({
      position: "asc"
    })
    const newRecords = createTreeHelper.tree(records)
    const id = req.params.id
    const data = await ProductCategory.findOne({
      _id: id
    }, {
      deleted: false
    })
    res.render("admin/pages/products-category/edit.pug", {
      pageTitle: "Chỉnh sửa danh mục sản phẩm",
      records: newRecords,
      data: data
    })
  } catch (error) {
    res.redirect(`${systemConfig.prefixAdmin}/products-category`)
  }
}
// [PATCH]: /admin/products-category/edit/:id
module.exports.editPatch = async (req, res) => {
  const id = req.params.id
  req.body.position = parseInt(req.body.position)
  const item = await ProductCategory.findOne({_id:id})
  await ProductCategory.updateOne({_id:id},req.body)
  req.flash("success", `Cập nhật danh mục ${item.title} thành công`)
  res.redirect(req.get("Referer"))
}