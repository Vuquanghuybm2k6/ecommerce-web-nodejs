const Product =require("../../models/product.model")
const filterStatusHelper = require("../../helper/admin/filterStatus")
const searchHelper = require("../../helper/admin/search")
const paginationHelper = require("../../helper/admin/pagination")
const systemConfig = require("../../config/system")
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
  await Product.updateOne({
    _id: id},
  {
    status: status
  })
  req.flash("success","Cập nhật trạng thái thành công")
  res.redirect(req.get("Referer"))
}
// [PATCH]: /admin/products/change-multi
module.exports.changeMulti = async (req,res) =>{
  const type = req.body.type
  const ids = req.body.ids.split(", ").map(id =>id.trim()) 
  // ban đầu req.body.ids là một string :"id1, id2, id3", dùng hàm split để tách các phần tử đó thành 1 mảng string ["id1", "id2", "id3"]
  // dùng map(id=>id.trim()) để duyệt từng phần tử trong mảng và trả ra một mảng mới, và xóa những dấu cách thừa đi
  switch(type){
    case "active":
      await Product.updateMany({_id:{$in:ids}},{status: "active"})
      req.flash("success",`Cập nhật trạng thái thành công ${ids.length} sản phẩm`)

      break
    case "inactive":
      await Product.updateMany({_id:{$in:ids}}, {status: "inactive"})
      req.flash("success",`Cập nhật trạng thái thành công ${ids.length} sản phẩm`)
      break
    case "delete-all":
      await Product.updateMany({_id:{$in:ids}},{deleted: true, deletedAt: new Date()})
      break
    case "change-position":
      for(const item of ids){
        let [id, position] = item.split("-")
        position = parseInt(position)
        await Product.updateOne({_id: id},{position: position})
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
  await Product.updateOne({_id:id}, {deleted:true, deletedAt: new Date()}) 
  // Không được gộp chung hai cái trường deleted và deletedAt vào chung 1 object vì mongodb cần biết cập nhật những document nào
  // cập nhật những trường nào
  res.redirect(req.get("Referer"))
}
// [GET]: /admin/products/create
module.exports.create = async (req,res)=>{
  res.render("admin/pages/products/create",{
    pageTitle: "Tạo mới sản phẩm"
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
  const product = new Product(req.body)
  await product.save()
  req.flash("success", "Tạo mới sản phẩm thành công")
  res.redirect(`${systemConfig.prefixAdmin}/products`)
}
// [GET]: /admin/products/edit
module.exports.edit = async (req,res)=>{
  const id = req.params.id
  const product = await Product.findOne({_id: id})
  res.render("admin/pages/products/edit",{
    pageTitle: "Chỉnh sửa sản phẩm",
    product: product
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
    await Product.updateOne({_id:id},req.body)
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
    const product =  await Product.findOne({_id: id}, {deleted: false})
    res.render("admin/pages/products/detail",{
      pageTitle: "Chi tiết sản phẩm",
      product: product
    })
  }
  catch(error){
    res.redirect(req.get("Referer"))
  }
}