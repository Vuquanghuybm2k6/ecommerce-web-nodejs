const mongoose = require("mongoose")
const generate = require("../helper/generate")
const accountSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  password: String,
  token: {
    type: String,
    default: ()=> generate.generateRandomString(20)
  },
  phone: String,
  avatar: String,
  role_id: String,
  status: String,
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
}, {
  timestamps: true // khi thêm trường này thì mongoose sẽ tự động thêm 2 trường createdAt và updatedAt
});
const Account = mongoose.model('Account', accountSchema, 'accounts')
module.exports = Account