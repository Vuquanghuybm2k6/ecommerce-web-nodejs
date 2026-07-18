const mongoose = require("mongoose")
const slug = require("mongoose-slug-updater")
mongoose.plugin(slug)
const productSchema = new mongoose.Schema({
  title: String,
  product_category_id: { type: String, default: "" },
  description: String,
  status: String,
  position: Number,
  featured: String,
  slug: {
    type: String,
    slug: "title",
    unique: true
  },
  createdBy: {
    account_id: String,
    createdAt: {
      type: Date,
      default: Date.now()
    }
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedBy: {
    account_id: String,
    deletedAt: Date,
  },
  ratingAvg: {
    type: Number,
    default: 0
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  variants: [{
    sku: { type: String, unique: true, default: "" },
    label: { type: String, default: "" },
    options: [{ key: String, value: String }],
    price: { type: Number, default: 0 },
    discountPercentage: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    thumbnail: { type: String, default: "" },
    status: { type: String, default: "active" }
  }],
  updatedBy : [
    {
      account_id: String,
      updatedAt: Date
    }
  ]
}, {
  timestamps: true
});
const Product = mongoose.model('Product', productSchema, 'products')
module.exports = Product