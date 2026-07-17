const Account = require("../../models/account.model")
const ProductCategory = require("../../models/product-category.model")
const Product = require("../../models/product.model")
const User = require("../../models/user.model")

// [GET]: /admin/dashboard
module.exports.dashboard = async (req,res) =>{
  const statistic = {
    categoryProduct: {
      total: 0,
      active: 0,
      inactive: 0
    },
    product: {
      total: 0,
      active: 0,
      inactive: 0
    },
    account: {
      total: 0,
      active: 0,
      inactive: 0
    },
    user: {
      total: 0,
      active: 0,
      inactive: 0
    },
  }

  const results = await Promise.all([
    ProductCategory.countDocuments({deleted: false}),
    ProductCategory.countDocuments({status: "active"}),
    ProductCategory.countDocuments({status: "inactive"}),
    Product.countDocuments({deleted: false}),
    Product.countDocuments({status: "active"}),
    Product.countDocuments({status: "inactive"}),
    Account.countDocuments({deleted: false}),
    Account.countDocuments({status: "active"}),
    Account.countDocuments({status: "inactive"}),
    User.countDocuments({deleted: false}),
    User.countDocuments({status: "active"}),
    User.countDocuments({status: "inactive"})
  ])

  statistic.categoryProduct.total = results[0]
  statistic.categoryProduct.active = results[1]
  statistic.categoryProduct.inactive = results[2]
  statistic.product.total = results[3]
  statistic.product.active = results[4]
  statistic.product.inactive = results[5]
  statistic.account.total = results[6]
  statistic.account.active = results[7]
  statistic.account.inactive = results[8]
  statistic.user.total = results[9]
  statistic.user.active = results[10]
  statistic.user.inactive = results[11]
  res.json({
    code: 200,
    message: "Thành công",
    data: {
      statistic: statistic
    }
  })
}
