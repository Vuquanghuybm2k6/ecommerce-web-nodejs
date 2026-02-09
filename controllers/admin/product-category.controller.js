const ProductCategory = require("../../models/product-category.model")
const systemConfig = require("../../config/system")
const createTreeHelper = require("../../helpers/createTree")
const Account = require("../../models/account.model")
const mongoose = require("mongoose")
// [GET]: /admin/products-category
module.exports.index = async (req, res) => {
  const find = {
    deleted: false
  }

  const records = await ProductCategory
  .find(find)
  .sort({position: "asc"})

  const newRecords = createTreeHelper.tree(records)
  for(const newRecord of newRecords){
    const user = await Account.findOne({_id: newRecord.createdBy.account_id})
    if(user){
      newRecord.fullName = user.fullName
    }
  }
  res.render("admin/pages/products-category/index.pug", {
    pageTitle: "Danh mục sản phẩm",
    records: newRecords,
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

// [GET]: /admin/products-category/edit/:id
module.exports.detail = async (req, res) => {
  const id = req.params.id
  if(!mongoose.Types.ObjectId.isValid(id)){ // kiểm tra xem id này có hợp lệ hay không, nếu id = "" thì sẽ bị crash
    return res.redirect(`${systemConfig.prefixAdmin}/products-category`)
  }
  const category = await ProductCategory.findOne({_id: id})
  if(!category){
    return res.redirect(`${systemConfig.prefixAdmin}/products-category`)
  }
  if(category.parent_id && mongoose.Types.ObjectId.isValid(category.parent_id)){ // kiểm tra xem id danh mục cha có hợp lệ k
    const parent = await ProductCategory.findOne({_id: category.parent_id})
    if(parent){
      category.parent_title = parent.title
    }
  }
  else{
    category.parent_title = "Danh mục gốc"
  }
  res.render("admin/pages/products-category/detail",{
    pageTitle: "Chi tiết danh mục sản phẩm",
    category: category
  })
}

// [PATCH]: /admin/products-category/delete/:id
module.exports.delete = async (req, res) => {
  try{
    const id = req.params.id
    const hasChild = await ProductCategory.countDocuments({ // kiểm tra xem trong cái danh mục sản phẩm này có chứa các danh mục con hay không
      deleted: false,
       parent_id: id
      })
    if(hasChild){
      req.flash("error", "Vui lòng xóa các danh mục con trước")
      return res.redirect(req.get("Referer"))
    }
    await ProductCategory.updateOne({_id: id}, {deleted: true})
    req.flash("success", "Xóa thành công danh mục sản phẩm")
    res.redirect(req.get("Referer"))
  }
  catch (error){
    req.flash("error", "Xóa danh mục thất bại")
    res.redirect(req.get("Referer"))
  }
}
