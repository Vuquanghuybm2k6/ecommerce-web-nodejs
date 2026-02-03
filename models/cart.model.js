const mongoose = require("mongoose")
const cartSchema = new mongoose.Schema({
  user_id: String,
  products: [
    {
      product_id: String,
      quantity: Number
    }
  ]
}, {
  timestamps: true // khi thêm trường này thì mongoose sẽ tự động thêm 2 trường createdAt và updatedAt
});
const Cart = mongoose.model('Cart', cartSchema, 'carts')
module.exports = Cart