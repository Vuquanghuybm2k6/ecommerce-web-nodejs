const Cart = require("../models/cart.model")
const { findProductMapByIds, calculatePriceNew } = require("./product")

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

// Tính giá của 1 dòng giỏ hàng dựa trên biến thể (sku) đã chọn.
// Dùng chung cho cart và checkout để không lặp lại công thức discount ở 2 nơi.
const resolveCartLinePricing = (cartItem, productInfo) => {
  const variant = (cartItem.variantSku && productInfo)
    ? (productInfo.variants || []).find(v => v.sku === cartItem.variantSku)
    : null

  const price = variant?.price || 0
  const discountPercentage = variant?.discountPercentage || 0

  return {
    variant,
    price,
    discountPercentage,
    priceNew: calculatePriceNew(price, discountPercentage)
  }
}

const enrichCartData = async (cart) => {
  if (!cart) return null

  const products = cart.products || []

  if (products.length > 0) {
    const productMap = await findProductMapByIds(products.map(item => item.product_id))

    products.forEach(item => {
      const productInfo = productMap[String(item.product_id)]
      const { variant, price, priceNew, discountPercentage } = resolveCartLinePricing(item, productInfo)

      item.productInfo = {
        _id: productInfo?._id,
        title: productInfo?.title || "Sản phẩm",
        thumbnail: item.thumbnail || variant?.thumbnail || "",
        slug: productInfo?.slug || "",
        price: price,
        priceNew: priceNew,
        discountPercentage: discountPercentage,
        variantLabel: item.variantLabel || "",
        variantOptions: item.variantOptions || [],
      }
      item.totalPrice = priceNew * (item.quantity || 1)
    })
  }

  cart.totalPrice = products.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
  return cart
}

// Gộp giỏ của khách vãng lai vào giỏ của user đã đăng nhập, rồi dọn các giỏ trùng.
// Trước đây có 3 bản implementation giống nhau ở user.controller, oauth.controller và cart.middleware.
const mergeGuestCartIntoUser = async ({ guestCartId, userId }) => {
  const [guestCart, userCart] = await Promise.all([
    guestCartId ? Cart.findById(guestCartId) : null,
    Cart.findOne({ user_id: userId }).sort({ createdAt: -1 })
  ])

  let finalCart = userCart

  if (guestCart && userCart) {
    if (guestCart._id.toString() !== userCart._id.toString()) {
      for (const item of guestCart.products) {
        const existing = userCart.products.find(
          p => p.product_id.toString() === item.product_id.toString()
            && (p.variantSku || "") === (item.variantSku || "")
        )
        if (existing) {
          existing.quantity += item.quantity
        } else {
          userCart.products.push(item)
        }
      }
      await userCart.save()
      await Cart.deleteOne({ _id: guestCart._id })
    }
  } else if (guestCart && !userCart) {
    guestCart.user_id = userId
    finalCart = guestCart
    await guestCart.save()
  } else if (!guestCart && !userCart) {
    finalCart = new Cart({ products: [], user_id: userId })
    await finalCart.save()
  }

  await Cart.deleteMany({
    user_id: userId,
    _id: { $ne: finalCart._id }
  })

  return finalCart
}

module.exports = {
  applyOrderToCart,
  resolveCartLinePricing,
  enrichCartData,
  mergeGuestCartIntoUser
}
