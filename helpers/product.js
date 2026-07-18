module.exports.priceNewProducts = (products) => {
  products.map(item => {
    const v = item.variants?.[0]
    const price = v?.price || 0
    const discountPercentage = v?.discountPercentage || 0
    item.priceNew = Number((price - price * discountPercentage / 100).toFixed(0))
    return item
  })
  return products
}

module.exports.priceNewProduct = (product) => {
  const v = product.variants?.[0]
  const price = v?.price || 0
  const discountPercentage = v?.discountPercentage || 0
  const priceNew = Number((price - price * discountPercentage / 100).toFixed(0))
  return priceNew
}