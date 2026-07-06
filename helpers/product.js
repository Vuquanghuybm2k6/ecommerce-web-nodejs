module.exports.priceNewProducts = (products) => {
  products.map(item => {
    item.priceNew = Number((item.price - item.price * item.discountPercentage / 100).toFixed(0))
    return item
  })
  return products
}
module.exports.priceNewProduct = (product) => {
  const priceNew = Number((product.price - product.price * product.discountPercentage / 100).toFixed(0))
  return priceNew
}