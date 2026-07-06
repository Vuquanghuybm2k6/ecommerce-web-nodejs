const Cart = require("../../models/cart.model")
const Product = require("../../models/product.model")
const productHelper = require("../../helpers/product")

const enrichCartData = async (cart) => {
  if (!cart) return null

  const products = cart.products || []

  if (products.length > 0) {
    const productInfos = await Promise.all(
      products.map(item => Product.findOne({ _id: item.product_id }))
    )

    products.forEach((item, index) => {
      const productInfo = productInfos[index]
      const productData = productInfo ? productInfo.toObject() : {}
      productData.priceNew = productHelper.priceNewProduct(productData)
      item.productInfo = {
        _id: productData._id,
        title: productData.title || 'Sản phẩm',
        thumbnail: productData.thumbnail || '',
        slug: productData.slug || '',
        price: productData.price || 0,
        priceNew: productData.priceNew || 0,
        discountPercentage: productData.discountPercentage || 0,
      }
      item.totalPrice = (productData.priceNew || 0) * (item.quantity || 1)
    })
  }

  cart.totalPrice = products.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
  return cart
}

module.exports.enrichCartData = enrichCartData

// [GET]: /cart
module.exports.index = async (req,res)=>{
  const cartId = req.cartId
  const cart = await Cart.findOne({_id: cartId})

  if(!cart){
    return res.json({
      code: 200,
      message: "Thành công",
      data: { cart: { _id: cartId, products: [], totalPrice: 0 } }
    })
  }

  const enrichedCart = await enrichCartData(cart)
  res.json({
    code: 200,
    message: "Thành công",
    data: { cart: enrichedCart }
  })
}
// [POST]: /cart/add/:productId
module.exports.addPost = async (req,res) =>{
  const cartId = req.cartId
  const productId = req.params.productId
  const quantity = parseInt(req.body.quantity)
  const cart = await Cart.findOne({_id: cartId})
  const exitProductInCart = cart.products.find(item => item.product_id == productId)
  const currentQuantity = exitProductInCart ? exitProductInCart.quantity : 0
  const totalQuantity = currentQuantity + quantity
  if(exitProductInCart){
    await Cart.updateOne({
      _id: cartId,
      'products.product_id': productId
    },{
      $set:{
        'products.$.quantity': totalQuantity
      }
    })
  }
  else{
    const objectCart = {
      product_id: productId,
      quantity : quantity
    }
    await Cart.updateOne({
      _id: cartId
    },{
      $push : {
        products: objectCart
      }
    })
  }
  const updatedCart = await Cart.findOne({_id: cartId})
  const enrichedCart = await enrichCartData(updatedCart)
  res.json({
    code: 200,
    message: "Thêm sản phẩm vào giỏ hàng thành công",
    data: { cart: enrichedCart }
  })
}
// [DELETE]: /delete/:productId
module.exports.delete = async (req,res)=>{
  const productId = req.params.productId
  const cartId = req.cartId
  await Cart.updateOne({
    _id:cartId
  },{
    $pull:{
      products: {
        'product_id': productId
      }
    }
  })
  const updatedCart = await Cart.findOne({_id: cartId})
  const enrichedCart = await enrichCartData(updatedCart)
  res.json({
    code: 200,
    message: "Đã xóa sản phẩm khỏi giỏ hàng!",
    data: { cart: enrichedCart }
  })
}
// [PUT]: /update/:productId
module.exports.update = async (req,res)=>{
  const productId = req.params.productId
  const cartId = req.cartId
  const quantity = parseInt(req.body.quantity)
  await Cart.updateOne({
    _id:cartId,
    'products.product_id': productId
  },{
   'products.$.quantity': quantity
  })
  const updatedCart = await Cart.findOne({_id: cartId})
  const enrichedCart = await enrichCartData(updatedCart)
  res.json({
    code: 200,
    message: "Đã cập nhật số lượng!",
    data: { cart: enrichedCart }
  })
}