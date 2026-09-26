const Product = require("../models/product.model")

const calculatePriceNew = (price = 0, discountPercentage = 0) => {
  const base = Number(price) || 0
  const discount = Number(discountPercentage) || 0
  return Number((base - base * discount / 100).toFixed(0))
}

module.exports.priceNewProducts = (products) => {
  products.map(item => {
    const v = item.variants?.[0]
    const price = v?.price || 0
    const discountPercentage = v?.discountPercentage || 0
    item.priceNew = calculatePriceNew(price, discountPercentage)
    return item
  })
  return products
}

module.exports.priceNewProduct = (product) => {
  const v = product.variants?.[0]
  const price = v?.price || 0
  const discountPercentage = v?.discountPercentage || 0
  return calculatePriceNew(price, discountPercentage)
}

module.exports.calculatePriceNew = calculatePriceNew

// Gom nhiều product_id thành 1 truy vấn $in rồi trả về map id -> sản phẩm,
// thay cho mẫu await Product.findOne() trong vòng lặp (N+1).
const findProductMapByIds = async (ids, select = "") => {
  const uniqueIds = [...new Set(ids.filter(Boolean))]
  const productMap = {}
  if (uniqueIds.length === 0) return productMap

  const query = Product.find({ _id: { $in: uniqueIds } }).lean()
  if (select) query.select(select)

  const products = await query
  products.forEach(product => { productMap[String(product._id)] = product })
  return productMap
}

module.exports.findProductMapByIds = findProductMapByIds
