const Product = require("../../models/product.model")
const productsHelper = require("../../helpers/product")
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
  const productsNewPrice  = productsHelper.priceNewProducts(productsNew)
  res.json({
    code: 200,
    message: "Thành công",
    data: {
      productsFeatured: newproductsFeatured,
      productsNew: productsNewPrice
    }
  })
}