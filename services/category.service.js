const mongoose = require("mongoose")
const ProductCategory = require("../models/product-category.model")
const Account = require("../models/account.model")
const httpError = require("../helpers/httpError")
const createTreeHelper = require("../helpers/createTree")
const { clearCategoryCache } = require("../helpers/cache")
const { logAction } = require("../helpers/logger")

// Gán tên người tạo vào các node danh mục.
// Gom account_id thành 1 truy vấn $in thay cho vòng lặp await Account.findOne trên từng node.
const attachCreatorNames = async (categories) => {
  const accountIds = [...new Set(
    categories
      .map(category => category.createdBy?.account_id)
      .filter(Boolean)
      .map(id => String(id))
  )]

  if (accountIds.length === 0) return categories

  const accounts = await Account.find({ _id: { $in: accountIds } })
    .select("fullName")
    .lean()

  const nameMap = {}
  accounts.forEach(account => { nameMap[String(account._id)] = account.fullName })

  categories.forEach(category => {
    const createdById = category.createdBy?.account_id
    if (createdById && nameMap[String(createdById)]) {
      category.fullName = nameMap[String(createdById)]
    }
  })

  return categories
}

const listCategories = async () => {
  const records = await ProductCategory.find({ deleted: false }).sort({ position: "asc" })
  const tree = createTreeHelper.tree(records)

  return { records: await attachCreatorNames(tree) }
}

const getCreateForm = async () => {
  const records = await ProductCategory.find({ deleted: false }).sort({ position: "asc" })
  return { records: createTreeHelper.tree(records) }
}

const createCategory = async ({ body, adminId }) => {
  const payload = { ...body }

  if (payload.position !== undefined && payload.position !== "") {
    payload.position = parseInt(payload.position)
  } else {
    const countCategory = await ProductCategory.countDocuments({ deleted: false })
    payload.position = countCategory + 1
  }

  payload.createdBy = {
    account_id: adminId
  }

  const record = new ProductCategory(payload)
  await record.save()

  logAction('category', 'create', `Tạo danh mục: ${record.title}`, { categoryId: record.id, adminId })
  await clearCategoryCache()
}

// Trả về cả cây danh mục và bản ghi đang sửa.
const getEditForm = async (id) => {
  const records = await ProductCategory.find({ deleted: false }).sort({ position: "asc" })

  // deleted: false phải nằm trong filter, không phải trong options (bug cũ làm lộ danh mục đã xoá mềm)
  const data = await ProductCategory.findOne({ _id: id, deleted: false })
  if (!data) throw httpError(404, "Danh mục không tồn tại")

  return {
    records: createTreeHelper.tree(records),
    data: data
  }
}

const updateCategory = async ({ id, body, adminId }) => {
  const payload = { ...body }
  if (payload.position !== undefined && payload.position !== "") {
    const position = parseInt(payload.position)
    if (!Number.isNaN(position)) payload.position = position
  }

  const item = await ProductCategory.findOne({ _id: id })
  if (!item) throw httpError(404, "Danh mục không tồn tại")

  await ProductCategory.updateOne({ _id: id }, payload)

  logAction('category', 'update', `Cập nhật danh mục: ${item.title}`, { categoryId: id, adminId })
  await clearCategoryCache()

  return { title: item.title }
}

const getDetail = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw httpError(400, "ID không hợp lệ")
  }

  const category = await ProductCategory.findOne({ _id: id })
  if (!category) throw httpError(404, "Danh mục không tồn tại")

  if (category.parent_id && mongoose.Types.ObjectId.isValid(category.parent_id)) {
    const parent = await ProductCategory.findOne({ _id: category.parent_id })
    category.parent_title = parent ? parent.title : "Danh mục gốc"
  } else {
    category.parent_title = "Danh mục gốc"
  }

  return { category: category }
}

const softDelete = async ({ id, adminId }) => {
  const hasChild = await ProductCategory.countDocuments({
    deleted: false,
    parent_id: id
  })

  if (hasChild) {
    throw httpError(400, "Vui lòng xóa các danh mục con trước")
  }

  await ProductCategory.updateOne({ _id: id }, { deleted: true })

  logAction('category', 'delete', `Xóa danh mục: ${id}`, { categoryId: id, adminId })
  await clearCategoryCache()
}

module.exports = {
  attachCreatorNames,
  listCategories,
  getCreateForm,
  createCategory,
  getEditForm,
  updateCategory,
  getDetail,
  softDelete
}
