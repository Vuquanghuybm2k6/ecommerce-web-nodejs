const Product =require("../../models/product.model")
const filterStatusHelper = require("../../helpers/filterStatus")
const searchHelper = require("../../helpers/search")
const paginationHelper = require("../../helpers/pagination")
const systemConfig = require("../../config/system")
const ProductCategory = require("../../models/product-category.model")
const createTreeHelper = require("../../helpers/createTree")
const Account = require("../../models/account.model")
// [GET]: /admin/products
module.exports.index = async (req,res) =>{
  const filterStatus = filterStatusHelper(req.query)
  let find = {
    deleted: false
  }
  if(req.query.status){
    find.status = req.query.status
  }

  // Search
  if(req.query.keyword){
    const regex = searchHelper(req.query)
    find.title = regex
  }
  // End Search

  // Paginate
  const totalProduct = await Product.countDocuments(find)
  const pagination = paginationHelper(req.query, totalProduct,{
    currentPage:1,
    limitItem: 4
  })
  // Paginate

  //  Sort
  const sort = {}
  if(req.query.sortKey && req.query.sortValue){
    sort[req.query.sortKey] = req.query.sortValue
  }
  else{
    sort.position = "desc"
  }
  // End Sort
  
  const products = await Product.find(find).limit(pagination.limitItem).skip(pagination.skip).sort(sort)
  for(const product of products){ 
    // Lấy ra thông tin người tạo
    const user  = await Account.findOne({_id: product.createdBy.account_id}) // từ account_id trong createdBy ở model product lấy ra id trong account
    if(user){
      product.fullName = user.fullName // gán biến fullName trong account vào product
    }
     // Lấy ra thông tin người cập nhật gần nhất
   if (product.updatedBy && product.updatedBy.length > 0) {
    const lastIndex = product.updatedBy.length - 1
    const lastUpdated = product.updatedBy[lastIndex]

    if (lastUpdated) {
      const userUpdated = await Account.findOne({_id: lastUpdated.account_id})
      if (userUpdated) {
        lastUpdated.fullName = userUpdated.fullName
      }
    }
  }
  }
  res.render("admin/pages/products/index.pug",
    {
      pageTitle: "Danh sách sản phẩm",
      products : products,
      filterStatus: filterStatus,
      keyword: req.query.keyword,
      pagination: pagination
    }
  )
}
// [PATCH]: /admin/products/change-status/:status/:id
module.exports.changeStatus = async (req,res) =>{
  const id = req.params.id
  const status = req.params.status
  const updatedBy = {
    account_id: res.locals.user.id,
    updatedAt: new Date()
  }
  await Product.updateOne({
    _id: id},
  {
    $set: { status }, // MongoDB KHÔNG cho trộn: field thường (status) và operator ($push)
    $push: {
      updatedBy : updatedBy
    }
  })
  req.flash("success","Cập nhật trạng thái thành công")
  res.redirect(req.get("Referer"))
}
// [PATCH]: /admin/products/change-multi
module.exports.changeMulti = async (req,res) =>{
  const type = req.body.type
  const ids = req.body.ids.split(", ").map(id =>id.trim()) 
  const updatedBy = {
    account_id: res.locals.user.id,
    updatedAt: new Date()
  }
  switch(type){
    case "active":
      await Product.updateMany({_id:{$in:ids}},{$set :{status: "active"}, $push: {updatedBy : updatedBy}})
      req.flash("success",`Cập nhật trạng thái thành công ${ids.length} sản phẩm`)

      break
    case "inactive":
      await Product.updateMany({_id:{$in:ids}}, {$set:{status: "inactive"}, $push: {updatedBy : updatedBy}})
      req.flash("success",`Cập nhật trạng thái thành công ${ids.length} sản phẩm`)
      break
    case "delete-all":
      await Product.updateMany(
        {
          _id:{$in:ids}
        },
        {
          deleted: true,
           deletedBy: {
            account_id : res.locals.user.id,
            deletedAt: new Date()
           }
          }
        )
      break
    case "change-position":
      for(const item of ids){
        let [id, position] = item.split("-")
        position = parseInt(position)
        await Product.updateOne({_id: id},{$set:{position: position}, $push: {updatedBy: updatedBy}})
      }
      break
    default:
      break
  }
  res.redirect(req.get("Referer"))
}
//[PATCH]: /admin/products/delete/:id
module.exports.delete = async (req,res)=>{
  const id = req.params.id
  await Product.updateOne(
    {
      _id:id
    },
     {
      deleted:true,
       deletedBy: {
        account_id : res.locals.user.id,
        deletedAt: new Date()
       }
      }
    ) 
  // Không được gộp chung hai cái trường deleted và deletedAt vào chung 1 object vì mongodb cần biết cập nhật những document nào
  // cập nhật những trường nào
  res.redirect(req.get("Referer"))
}
// [GET]: /admin/products/create
module.exports.create = async (req,res)=>{
  let find = {deleted: false}
  const category = await ProductCategory.find(find)
  const newCategory = createTreeHelper.tree(category)
  res.render("admin/pages/products/create",{
    pageTitle: "Tạo mới sản phẩm",
    category: newCategory
  })
}
// [POST]: /admin/products/create
module.exports.createPost = async (req,res)=>{
  req.body.price = parseInt(req.body.price)
  req.body.discount = parseInt(req.body.discount)
  req.body.stock = parseInt(req.body.stock)
  if(req.body.position){
    req.body.position = parseInt(req.body.position)
  }
  else{
    const countProduct = await Product.countDocuments()
    req.body.position = countProduct+1 
  }
  req.body.createdBy = { // gán thông tin dữ liệu người tạo sản phẩm trước khi lưu vào db
    account_id : res.locals.user.id // res.locals.user lấy từ bên phía middleware khi đăng nhập
  }
  const product = new Product(req.body)
  await product.save()
  req.flash("success", "Tạo mới sản phẩm thành công")
  res.redirect(`${systemConfig.prefixAdmin}/products`)
}
// [GET]: /admin/products/edit
module.exports.edit = async (req,res)=>{
  const id = req.params.id
  const product = await Product.findOne({_id: id})
  const category = await ProductCategory.find({deleted:false})
  const newCategory = createTreeHelper.tree(category)
  res.render("admin/pages/products/edit",{
    pageTitle: "Chỉnh sửa sản phẩm",
    product: product,
    category: newCategory
  })
}
// [PATCH]: /admin/products/edit
module.exports.editPatch = async (req,res) =>{
  const id =req.params.id
  req.body.price = parseInt(req.body.price)
  req.body.discountPercentage = parseInt(req.body.discountPercentage)
  req.body.stock = parseInt(req.body.stock)
  req.body.position = parseInt(req.body.position)
  if(req.file){
    req.body.thumbnail = `/uploads/${req.file.filename}`
  }
  try{
    const updatedBy = {
    account_id: res.locals.user.id,
    updatedAt: new Date()
    }
    await Product.updateOne(
      {
        _id:id
      },{
      $set: req.body, // $set: gán, cập nhật giá trị cho field
      $push: { // $push: thêm phần tử vào mảng, ko ghi đè giá trị cũ
        updatedBy : updatedBy
      }
  }
    )
    req.flash("success", "Cập nhật thành công sản phẩm")
  }
  catch(error){
    req.flash("error", "Cập nhật sản phẩm thất bại")
  }
  res.redirect(req.get("Referer"))
}
// [GET]: /admin/products/detail
module.exports.detail = async (req,res)=>{
  try{
    const id = req.params.id
    const product =  await Product.findOne({_id: id, deleted: false})
    res.render("admin/pages/products/detail",{
      pageTitle: "Chi tiết sản phẩm",
      product: product
    })
  }
  catch(error){
    res.redirect(req.get("Referer"))
  }
}
// [GET]: /admin/products/update-position
module.exports.update = async (req,res)=>{
  const position = parseInt(req.params.position)
  const id = req.params.id
  const updatedBy = {
    account_id: res.locals.user.id,
    updatedAt: new Date()
    }
    await Product.updateOne(
      {
        _id:id
      },{
      $set: {position : position}, 
      $push: { // $push: thêm phần tử vào mảng, ko ghi đè giá trị cũ
        updatedBy : updatedBy
      }
  }
    )
  req.flash("success","Cập nhật vị trí thành công")
  res.redirect(req.get("Referer"))
}