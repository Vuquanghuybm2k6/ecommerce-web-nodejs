const mongoose = require("mongoose")
const roleSchema = new mongoose.Schema({
  title: String,
  product_category_id: {
    type: String,
    default: ""
  },
  description: String,
  permissions: {
    type: Array,
    default: []
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
}, {
  timestamps: true // khi thêm trường này thì mongoose sẽ tự động thêm 2 trường createdAt và updatedAt
});
const Role = mongoose.model('Role', roleSchema, 'roles')
module.exports = Role