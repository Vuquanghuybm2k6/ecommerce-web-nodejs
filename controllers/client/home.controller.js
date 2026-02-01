const Product = require("../../models/product.model")
const productsHelper = require("../../helper/product")
// [GET]: /
module.exports.index = async (req,res)=>{
  const productsFeatured = await Product.find({
    deleted: false,
    status: "active",
    featured: "1"
  }).limit(6) // Lấy ra 6 sản phẩm nổi bật
  const productsNew = await Product.find({
    deleted: false,
    status : "active",
  }).limit(6).sort({position: "desc"}) // Lấy ra 6 sản phẩm mới nhất
  const newproductsFeatured  = productsHelper.priceNewProducts(productsFeatured)
  res.render("client/pages/home/index",{
    pageTitle: "Đây là trang chủ",
    productsFeatured: newproductsFeatured,
    productsNew: productsNew
  }
  )
}