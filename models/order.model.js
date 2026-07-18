const mongoose = require("mongoose")
const orderSchema = new mongoose.Schema({
  cart_id: String,
  user_id: String,
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
      quantity: Number,
      variantSku: { type: String, default: "" },
      variantLabel: { type: String, default: "" },
      variantOptions: [{ key: String, value: String }]
    }
  ],
  status: {
    type: String,
    enum: ['pending', 'pending_vnpay', 'payment_failed', 'confirmed', 'shipped', 'delivered', 'cancelled'],
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
  paymentMethod: {
    type: String,
    enum: ['cod', 'vnpay'],
    default: 'cod'
  },
  paymentInfo: {
    transactionId: String, // vnp_TransactionNo
    bankCode: String, // vnp_BankCode
    payDate: String, // vnp_PayDate
    paymentStatus: String // 'success' or 'failed'
  },
  shippingMethod: String,
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
  deleted: {
    type: Boolean,
    default: false
  }
},{
  timestamps: true
});
const Order = mongoose.model('Order', orderSchema, "orders")
module.exports = Order