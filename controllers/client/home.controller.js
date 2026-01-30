const Product = require("../../models/product.model")
const productsHelper = require("../../helper/product")
// [GET]: /
module.exports.index = async (req,res)=>{
  const productFeatured = await Product.find({
    deleted: false,
    status: "active",
    featured: "1"
  })
  const newproductFeatured  = productsHelper.priceNewProducts(productFeatured)
  res.render("client/pages/home/index",{
    pageTitle: "Đây là trang chủ",
    productFeatured: newproductFeatured
  }
  )
}