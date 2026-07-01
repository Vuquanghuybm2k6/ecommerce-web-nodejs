const Account = require("../../models/account.model")
const Role = require("../../models/role.model")
const bcrypt = require("bcrypt")
const systemConfig = require("../../config/system")
const paginationHelper = require("../../helpers/pagination")
const searchHelper = require("../../helpers/search")
// [GET]: /admin/accounts
module.exports.index = async (req, res) => {
  const find = {
    deleted: false
  }

  // Search
  if(req.query.keyword){
    const regex = searchHelper(req.query)
    find.fullName = regex
  }
  // End Search

  // Pagination
  const totalItem = await Account.countDocuments(find)
  const pagination = paginationHelper(req.query, totalItem, {
    currentPage: 1,
    limitItem: 4
  })
  // End Pagination

  const records = await Account
  .find(find)
  .select("-password -token") // loại bỏ những trường không muốn gửi ra bên fe
  .limit(pagination.limitItem)
  .skip(pagination.skip)
  for (const record of records) {
    const role = await Role.findOne({
      _id: record.role_id,
      deleted: false
    })
    record.role = role
  }
  res.json({
    code: 200,
    message: "Thành công",
    data: {
      records: records,
      pagination: pagination
    }
  })
}
// [GET]: /admin/accounts/create
module.exports.create = async (req, res) => {
  const roles = await Role.find({
    deleted: false
  })
  res.json({
    code: 200,
    message: "Thành công",
    data: {
      roles: roles
    }
  })
}
// [POST]: /admin/accounts/create
module.exports.createPost = async (req, res) => {
  const emailExit = await Account.findOne({
    email: req.body.email,
    deleted: false
  })
  if (emailExit) {
    return res.status(400).json({
      code: 400,
      message: `Email đã tồn tại`
    })
  } else {
    req.body.password = bcrypt.hashSync(req.body.password, 10)
    const record = new Account(req.body)
    await record.save()
    res.json({
      code: 200,
      message: "Thao tác thành công"
    })
  }
}
// [GET]: /admin/accounts/edit
module.exports.edit = async (req, res) => {
  try {
    const id = req.params.id
    const account = await Account.findOne({
      _id: id,
      deleted: false
    }).select("-password -token")
    const roles = await Role.find({
      deleted: false
    })
    res.json({
      code: 200,
      message: "Thành công",
      data: {
        account: account,
        roles: roles
      }
    })
  } catch (error) {
    res.json({
      code: 400,
      message: "Lỗi"
    })
  }
}
// [PATCH]: /admin/accounts/edit
module.exports.editPatch = async (req, res) => {
  const id = req.params.id
  const emailExit = await Account.findOne({
    _id: {
      $ne: id
    }, // khi mà chỉnh sửa thì ta phải loại trừ cái email của chính bản thân ra, tìm email k phải của mình để check
    email: req.body.email,
    deleted: false
  })
  if (emailExit) {
    return res.status(400).json({
      code: 400,
      message: `Email ${req.body.email} đã tồn tại`
    })
  } else {
    if (req.body.password) {
      req.body.password = bcrypt.hashSync(req.body.password, 10)
    } else {
      delete req.body.password
    }
    await Account.updateOne({
      _id: id
    }, req.body)
    res.json({
      code: 200,
      message: "Cập nhật tài khoản thành công"
    })
  }
}
// [GET]: /admin/accounts/detail/:id
module.exports.detail = async (req, res) => {
  try {
    const id = req.params.id
    const account = await Account.findOne({
      _id: id,
      deleted: false
    }).select("-password -token")
    const roles = await Role.find({
      deleted: false
    })
    for (const role of roles) {
      if (account.role_id == role.id) {
        account.role = role.title
      }
    }
    res.json({
      code: 200,
      message: "Thành công",
      data: {
        account: account
      }
    })
  } catch (error) {
    res.json({
      code: 400,
      message: "Lỗi"
    })
  }
}
// [PATCH]: /admin/accounts/delete/:id
module.exports.delete = async (req, res) => {
  try {
    const id = req.params.id
    await Account.updateOne({
      _id: id
    }, {
      deleted: true,
      deletedAt: new Date()
    })
    res.json({
      code: 200,
      message: "Xóa tài khoản thành công"
    })
  } catch (error) {
    res.json({
      code: 400,
      message: "Xóa tài khoản thất bại"
    })
  }
}
// [PATCH]: /admin/accounts/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {
  try {
    const id = req.params.id
    const status = req.params.status
    await Account.updateOne({
      _id: id
    }, {
      status: status
    })
    res.json({
      code: 200,
      message: "Cập nhật thành công"
    })
  } catch (error) {
    res.status(400).json({
      code: 400,
      message: "Cập nhật thất bại"
    })
  }
}
