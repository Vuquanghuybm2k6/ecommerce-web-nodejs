const Product = require("../../models/product.model")
const productHelper = require("../../helpers/product")
const productsCategoryHelper = require("../../helpers/products-category")
const ProductCategory = require("../../models/product-category.model")
const paginationHelper = require("../../helpers/pagination")
const searchHelper = require("../../helpers/search")
const redis = require("../../config/redis")
const { logger } = require("../../helpers/logger")
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
  const newPriceProducts = productHelper.priceNewProducts(products)
  res.json({
    code: 200,
    message: "Thành công",
    data: {
      products: newPriceProducts,
      pagination: pagination
    }
  })
}
// [GET]: /products/:slugCategory
module.exports.category = async (req, res) => {
  try {
    const slug = req.params.slugCategory
    const page = req.query.page || 1
    const cacheKey = `products:category:${slug}:page:${page}`

    const cached = await redis.get(cacheKey)
    if (cached) return res.json(JSON.parse(cached))

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
    const newPriceProducts = productHelper.priceNewProducts(products)

    const responseData = {
      code: 200,
      message: "Thành công",
      data: {
        products: newPriceProducts,
        pagination: pagination
      }
    }

    await redis.set(cacheKey, JSON.stringify(responseData), 'EX', 300)
    res.json(responseData)
  }
  catch(error){
    logger.error('Lỗi lấy sản phẩm theo danh mục', { error: error.message, stack: error.stack })
    res.status(400).json({ code: 400, message: "Không tìm thấy danh mục sản phẩm" })
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
    product.priceNew = productHelper.priceNewProduct(product)
    if(product.product_category_id){
      const category = await ProductCategory.findOne({
        _id: product.product_category_id,
        deleted: false,
        status: "active"
      })
      product.category = category
    }
    res.json({
      code: 200,
      message: "Thành công",
      data: { product: product }
    })
  }
  catch(error){
    logger.error('Lỗi lấy chi tiết sản phẩm', { error: error.message, stack: error.stack })
    res.status(400).json({ code: 400, message: "Không tìm thấy sản phẩm" })
  }
}