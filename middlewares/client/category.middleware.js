const ProductCategory = require("../../models/product-category.model")
const createTreeHelper = require("../../helper/createTree")
module.exports.category = async (req,res,next) =>{
  let find = {
    deleted : false
  }
  const productsCategory = await ProductCategory.find(find)
  const newProductCategory = createTreeHelper.tree(productsCategory)
  res.locals.layoutProductsCategory = newProductCategory
  next()
}