const Product = require("../../models/product.model")
const productHelper = require("../../helpers/product")
const productsCategoryHelper = require("../../helpers/products-category")
const ProductCategory = require("../../models/product-category.model")
const paginationHelper = require("../../helpers/pagination")
const searchHelper = require("../../helpers/search")
// [GET]: /products
module.exports.index = async (req, res) => {

  const find = {
    deleted: false,
    status: "active"
  }
  // Search
    if(req.query.keyword){
      const regex = searchHelper(req.query)
      find.title = regex
    }
  // End Search
   
  // Pagination
  const totalItem = await Product.countDocuments(find)
  const pagination = paginationHelper(req.query, totalItem, {
      currentPage: 1,
      limitItem: 6
    })
  // End Pagination

  const products = await Product
  .find(find)
  .limit(pagination.limitItem)
  .skip(pagination.skip)
  .sort({position: "desc"})
  const newProducts = productHelper.priceNewProducts(products)
  res.render("client/pages/products/index", {
    pageTitle: "Danh sách sản phẩm",
    products: newProducts,
    pagination: pagination
  })
}
// [GET]: /products/:slugCategory
module.exports.category = async (req, res) => {
  try {
    const slug = req.params.slugCategory
    const category = await ProductCategory.findOne({
      slug: slug,
      deleted: false
    })
    const listSubCategory = await productsCategoryHelper.getSubCategory(category._id)
    const listSubCategoryId = listSubCategory.map(item => item._id)
    const find = {
      product_category_id: {$in :[category._id, ...listSubCategoryId]},
      deleted : false,
      status: "active"
    }
    const products = await Product.find(find).sort({position: "desc"})
    const newPriceProducts = productHelper.priceNewProducts(products)
    res.render("client/pages/products/index", {
      pageTitle: category.title,
      products: newPriceProducts
    })
  }
  catch(error){
    console.error(error)
    res.redirect("/products")
  }
}
// [GET]: /products/detail/:slugProduct
module.exports.detail = async (req, res) => {
  try {
    const slug = req.params.slugProduct
    const product = await Product.findOne({
      slug: slug,
      deleted: false,
      status: "active"
    })
    if(product.product_category_id){
      const category = await ProductCategory.findOne({
        _id: product.product_category_id,
        deleted: false,
        status: "active"
      })
      product.category = category
      product.priceNew = productHelper.priceNewProduct(product)
      res.render("client/pages/products/detail", {
        pageTitle: product.title,
        product: product
      })
    }
  }
  catch(error){
    res.redirect("/products")
    console.error(error)
  }
}