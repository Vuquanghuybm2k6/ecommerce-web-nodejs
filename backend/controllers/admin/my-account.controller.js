const bcrypt = require('bcrypt')
const Account = require("../../models/account.model")

// [GET] /admin/my-account
module.exports.index = (req, res) => {
  res.json({
    code: 200,
    message: "Thành công",
    data: {
      user: req.user
    }
  });
}

// [GET] /admin/my-account/edit
module.exports.edit = (req, res) => {
  res.json({
    code: 200,
    message: "Thành công"
  });
}

// [PATCH] /admin/my-account/edit
module.exports.editPatch = async (req, res) => {
  const id = req.user.id
  const emailExit = await Account.findOne({
    _id: {
      $ne: id // khi mà chỉnh sửa thì ta phải loại trừ cái email của chính bản thân ra
    },
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
  }
  await Account.updateOne({
      _id: id
    },
    req.body
  )
  res.json({
    code: 200,
    message: "Cập nhật tài khoản thành công!"
  })
}
