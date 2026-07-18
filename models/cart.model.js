const mongoose = require("mongoose")
const cartSchema = new mongoose.Schema({
  user_id: String,
  products: [{
    product_id: String,
    quantity: Number,
    variantSku: { type: String, default: "" },
    variantLabel: { type: String, default: "" },
    variantOptions: [{ key: String, value: String }],
    thumbnail: { type: String, default: "" }
  }]
}, {
  timestamps: true
});
const Cart = mongoose.model('Cart', cartSchema, 'carts')
module.exports = Cart