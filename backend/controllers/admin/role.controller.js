const Role = require("../../models/role.model")
const systemConfig = require("../../config/system")
const paginationHelper = require("../../helpers/pagination")
const searchHelper = require("../../helpers/search")

// [GET]: /admin/roles
module.exports.index = async (req, res) => {
  const find = {
    deleted: false
  }
  // Pagination
  const totalItem = await Role.countDocuments({deleted: false})
  const pagination = paginationHelper(req.query, totalItem, {
    currentPage: 1,
    limitItem: 4
  })
  // End Pagination

  // Search
  if(req.query.keyword){
    const regex = searchHelper(req.query)
    find.title = regex
  }
  // End Search

  const records = await Role
  .find(find)
  .limit(pagination.limitItem)
  .skip(pagination.skip)
  res.json({
    code: 200,
    message: "Thành công",
    data: {
      records: records,
      pagination: pagination
    }
  })
}

// [GET]: /admin/roles/create
module.exports.create = async (req, res) => {
  res.json({
    code: 200,
    message: "Thành công"
  })
}

// [POST]: /admin/roles/create
module.exports.createPost = async (req, res) => {
  const record = new Role(req.body)
  await record.save()
  res.json({
    code: 200,
    message: "Tạo mới nhóm quyền thành công"
  })
}

// [PATCH]: /admin/roles/delete/:id
module.exports.delete = async (req, res) => {
  const id = req.params.id
  await Role.updateOne({
    _id: id
  }, {
    deleted: true
  })
  res.json({
    code: 200,
    message: "Xóa nhóm quyền thành công"
  })
}

// [GET]: /admin/roles/edit/:id
module.exports.edit = async (req, res) => {
  try {
    const id = req.params.id
    const data = await Role.findOne({
      _id: id
    }, {
      deleted: false
    })
    res.json({
      code: 200,
      message: "Thành công",
      data: {
        data: data
      }
    })
  } catch (error) {
    res.json({
      code: 400,
      message: "Lỗi"
    })
  }
}

// [PATCH]: /admin/roles/delete/:id
module.exports.editPatch = async (req, res) => {
  try {
    const id = req.params.id
    await Role.updateOne({
      _id: id
    }, req.body)
    res.json({
      code: 200,
      message: "Cập nhật nhóm quyền thành công"
    })
  } catch (error) {
    res.status(400).json({
      code: 400,
      message: "Cập nhật nhóm quyền thất bại"
    })
  }
}

// [GET]: /admin/roles/permissions
module.exports.permissions = async (req, res) => {
  try {
  let find = {
    deleted: false
  }
  const records = await Role.find(find)
    res.json({
      code: 200,
      message: "Thành công",
      data: {
        records: records
      }
    })
  } catch (error) {
    res.json({
      code: 400,
      message: "Lỗi"
    })
  }
}

// [PATCH]: /admin/roles/permissions
module.exports.permissionsPatch = async (req, res) => {
  const permissions = JSON.parse(req.body.permissions)
  console.log(permissions)
  for(const item of permissions){
    await Role.updateOne({_id: item.id}, {permissions: item.permissions})
  }
  res.json({
    code: 200,
    message: "Cập nhật phân quyền thành công"
  })
}
