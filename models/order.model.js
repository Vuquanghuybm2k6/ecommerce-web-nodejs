const mongoose = require("mongoose")
const orderSchema = new mongoose.Schema({
  cart_id: String,
  user_id: String,
  userInfo :{
    fullName: String,
    phone: String,
    address: String
  },
  products: [{
    product_id: String,
    price: Number,
    discountPercentage: Number,
    priceNew: Number,
    quantity: Number,
    variantSku: { type: String, default: "" },
    variantLabel: { type: String, default: "" },
    variantOptions: [{ key: String, value: String }]
  }],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  orderCode:{
    type: String,
    unique: true
  },
  paymentRefs: {
    type: [String],
    default: []
  },
  paymentMethod: {
    type: String,
    default: 'cod'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'cancelled'],
    default: 'pending'
  },
  shippingMethod: String,
  deleted: {
    type: Boolean,
    default: false
  }
},{
  timestamps: true
});
const Order = mongoose.model('Order', orderSchema, "orders")
module.exports = Order