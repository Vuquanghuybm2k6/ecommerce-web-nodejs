function applyOrderToCart(cart, orderProducts = []) {
  if (!cart || !Array.isArray(cart.products)) return cart

  for (const orderProduct of orderProducts) {
    const sku = orderProduct.variantSku || ""
    const index = cart.products.findIndex(
      item =>
        String(item.product_id) === String(orderProduct.product_id) &&
        (item.variantSku || "") === sku
    )
    if (index === -1) continue

    const orderedQty = Number(orderProduct.quantity) || 0
    cart.products[index].quantity -= orderedQty

    if (!cart.products[index].quantity || cart.products[index].quantity <= 0) {
      cart.products.splice(index, 1)
    }
  }

  return cart
}

module.exports = { applyOrderToCart }