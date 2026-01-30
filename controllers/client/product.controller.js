const Product = require("../../models/product.model")
const productHelper = require("../../helper/product")
// [GET]: /products
module.exports.index = async (req, res) => {
  const products = await Product.find({
    deleted: false,
    status: "active"
  }).sort({
    postion: "desc"
  })
  const newProducts = productHelper.priceNewProducts(products)
  res.render("client/pages/products/index", {
    pageTitle: "Danh sách sản phẩm",
    products: newProducts
  })
}
// [GET]: /products/:slug
module.exports.detail = async (req, res) => {
  try {
    const slug = req.params.slug
    const find = {
      deleted: false,
      slug: slug,
      status: "active"
    }
    const product = await Product.findOne(find)
    res.render("client/pages/products/detail", {
      pageTitle: product.title,
      product: product
    })
  }
  catch(error){
    res.redirect("/products")
  }
}