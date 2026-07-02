const mongoose = require("mongoose")
const orderSchema = new mongoose.Schema({
  cart_id: String,
  userInfo :{
    fullName: String,
    phone: String,
    address: String
  },
  products :[
    {
      product_id: String,
      price: Number,
      discountPercentage: Number,
      priceNew: Number,
      quantity: Number
    }
  ],
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
  user_id: String,
  paymentMethod: String,
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