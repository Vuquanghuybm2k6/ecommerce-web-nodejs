const Cart = require("../models/cart.model")
const Product = require("../models/product.model")
const httpError = require("../helpers/httpError")
const { enrichCartData, resolveCartLinePricing } = require("../helpers/cart")
const { findProductMapByIds } = require("../helpers/product")

const getCartDetail = async (cartId) => {
  const cart = await Cart.findOne({ _id: cartId }).lean()

  if (!cart) {
    return { cart: { _id: cartId, products: [], totalPrice: 0 } }
  }

  return { cart: await enrichCartData(cart) }
}

const addItem = async ({ cartId, productId, quantity, variantSku }) => {
  const cart = await Cart.findOne({ _id: cartId }).lean()
  if (!cart) throw httpError(404, "Giỏ hàng không tồn tại")

  const product = await Product.findOne({ _id: productId }).lean()
  if (!product) throw httpError(404, "Sản phẩm không tồn tại")

  let variant = null
  if (variantSku) {
    variant = (product.variants || []).find(v => v.sku === variantSku)
    if (!variant) throw httpError(400, "Phiên bản sản phẩm không tồn tại")
  } else if (product.variants?.length) {
    throw httpError(400, "Vui lòng chọn biến thể sản phẩm")
  }

  const exitProductInCart = (cart.products || []).find(
    item => item.product_id == productId && (item.variantSku || "") === (variantSku || "")
  )

  if (exitProductInCart) {
    await Cart.updateOne(
      {
        _id: cartId,
        'products.product_id': productId,
        'products.variantSku': variantSku
      },
      {
        $set: {
          'products.$.quantity': exitProductInCart.quantity + quantity
        }
      }
    )
  } else {
    await Cart.updateOne(
      { _id: cartId },
      {
        $push: {
          products: {
            product_id: productId,
            quantity: quantity,
            variantSku: variantSku,
            variantLabel: variant ? variant.label : "",
            variantOptions: variant ? variant.options : [],
            thumbnail: variant?.thumbnail || ""
          }
        }
      }
    )
  }

  return { cart: await enrichCartData(await Cart.findOne({ _id: cartId }).lean()) }
}

const removeItem = async ({ cartId, productId, variantSku }) => {
  await Cart.updateOne(
    { _id: cartId },
    {
      $pull: {
        products: {
          product_id: productId,
          variantSku: variantSku
        }
      }
    }
  )

  return { cart: await enrichCartData(await Cart.findOne({ _id: cartId }).lean()) }
}

const updateItemQuantity = async ({ cartId, productId, quantity, variantSku }) => {
  await Cart.updateOne(
    {
      _id: cartId,
      'products.product_id': productId,
      'products.variantSku': variantSku
    },
    { 'products.$.quantity': quantity }
  )

  return { cart: await enrichCartData(await Cart.findOne({ _id: cartId }).lean()) }
}

// Chuyển dòng giỏ hàng thành snapshot sản phẩm để lưu vào đơn hàng.
// Dùng chung với checkout nên không lặp lại công thức tính giá ở 2 nơi.
const buildOrderLines = async (cartItems = []) => {
  if (cartItems.length === 0) return { products: [], totalPrice: 0 }

  const productMap = await findProductMapByIds(cartItems.map(item => item.product_id))

  let totalPrice = 0
  const products = cartItems.map((item) => {
    const productInfo = productMap[String(item.product_id)]
    const { price, priceNew, discountPercentage } = resolveCartLinePricing(item, productInfo)

    totalPrice += priceNew * item.quantity

    return {
      product_id: item.product_id,
      quantity: item.quantity,
      discountPercentage: discountPercentage,
      price: price,
      priceNew: priceNew,
      variantSku: item.variantSku || "",
      variantLabel: item.variantLabel || "",
      variantOptions: item.variantOptions || []
    }
  })

  return { products: products, totalPrice: totalPrice }
}

module.exports = {
  getCartDetail,
  addItem,
  removeItem,
  updateItemQuantity,
  buildOrderLines
}
