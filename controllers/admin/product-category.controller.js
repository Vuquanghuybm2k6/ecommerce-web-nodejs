const ProductCategory =require("../../models/product-category.model")
const systemConfig = require("../../config/system")
const createTreeHelper = require("../../helper/createTree")
// [GET]: /admin/products-category
module.exports.index = async (req,res) =>{
  const find = {deleted: false}
  const records = await ProductCategory.find(find).sort({position: "asc"})
  const newRecords = createTreeHelper.tree(records)
  res.render("admin/pages/products-category/index.pug",{
    pageTitle: "Danh mục sản phẩm",
    records: newRecords
  }
  )
}
// [GET]: /admin/products-category/create
module.exports.create = async (req,res) =>{
  const find = {deleted: false}
  const records = await ProductCategory.find(find).sort({position: "asc"})
  const newRecords = createTreeHelper.tree(records)
  res.render("admin/pages/products-category/create",{
    pageTitle: "Tạo mới danh mục sản phẩm",
    records: newRecords
  })
}
// [POST]: /admin/products-category/create
module.exports.createPost = async (req,res) =>{
  if(req.body.position !== ""){
    req.body.position = parseInt(req.body.position)
  }
  else{
    const countCategory = await ProductCategory.countDocuments({deleted: false})
    req.body.position = countCategory + 1
  }
  const record = new ProductCategory(req.body)
  await record.save()
  req.flash("success", "Tạo mới danh mục sản phẩm thành công")
  res.redirect(`${systemConfig.prefixAdmin}/products-category`)
}