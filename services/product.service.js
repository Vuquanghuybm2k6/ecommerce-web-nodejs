const Product = require("../models/product.model")
const ProductCategory = require("../models/product-category.model")
const Account = require("../models/account.model")
const httpError = require("../helpers/httpError")
const searchHelper = require("../helpers/search")
const filterStatusHelper = require("../helpers/filterStatus")
const paginationHelper = require("../helpers/pagination")
const createTreeHelper = require("../helpers/createTree")
const productsCategoryHelper = require("../helpers/products-category")
const { clearCategoryCache } = require("../helpers/cache")
const { priceNewProducts, priceNewProduct } = require("../helpers/product")
const { uploadUrl } = require("../middlewares/admin/uploadCoud")
const { logAction } = require("../helpers/logger")

const redis = require("../config/redis")

const CLOUDINARY_DOMAIN = "cloudinary.com"
const CATEGORY_CACHE_TTL_SECONDS = 300

// Gán tên người tạo và người cập nhật gần nhất vào từng sản phẩm.
// Gom toàn bộ account_id thành 1 truy vấn $in thay cho vòng lặp await Account.findOne (1 + 2N query).
const attachActorNames = async (products) => {
  const accountIds = new Set()
  products.forEach(product => {
    if (product.createdBy?.account_id) accountIds.add(String(product.createdBy.account_id))
    const updatedBy = product.updatedBy || []
    const lastUpdated = updatedBy[updatedBy.length - 1]
    if (lastUpdated?.account_id) accountIds.add(String(lastUpdated.account_id))
  })

  if (accountIds.size === 0) return products

  const accounts = await Account.find({ _id: { $in: [...accountIds] } })
    .select("fullName")
    .lean()

  const nameMap = {}
  accounts.forEach(account => { nameMap[String(account._id)] = account.fullName })

  products.forEach(product => {
    const createdById = product.createdBy?.account_id
    if (createdById && nameMap[String(createdById)]) {
      product.fullName = nameMap[String(createdById)]
    }

    const updatedBy = product.updatedBy || []
    const lastUpdated = updatedBy[updatedBy.length - 1]
    if (lastUpdated && nameMap[String(lastUpdated.account_id)]) {
      lastUpdated.fullName = nameMap[String(lastUpdated.account_id)]
    }
  })

  return products
}

// Biến thể thiếu ảnh sẽ lấy ảnh từ req.body.variantThumbnails theo đúng thứ tự index,
// ảnh còn lại (URL ngoài cloudinary) thì đẩy lên cloudinary.
const normalizeVariantThumbnails = async (variants, uploadedThumbnails = []) => {
  let vi = 0
  const thumbnails = variants.map((variant) => {
    if (!variant.thumbnail) {
      return uploadedThumbnails?.[vi++] || ""
    }
    return variant.thumbnail
  })

  const uploaded = await Promise.all(
    thumbnails.map(url => (url && !url.includes(CLOUDINARY_DOMAIN) ? uploadUrl(url) : url))
  )

  return variants.map((variant, idx) => ({
    ...variant,
    thumbnail: uploaded[idx] || "",
  }))
}

// Đẩy ảnh biến thể đang lưu bằng URL ngoài lên cloudinary (tự động upload khi mở trang edit)
const migrateVariantThumbnails = async (product) => {
  if (!product?.variants?.length) return false

  let changed = false
  const variants = await Promise.all(product.variants.map(async variant => {
    if (variant.thumbnail && !variant.thumbnail.includes(CLOUDINARY_DOMAIN)) {
      const newUrl = await uploadUrl(variant.thumbnail)
      if (newUrl !== variant.thumbnail) {
        changed = true
        return { ...variant, thumbnail: newUrl }
      }
    }
    return variant
  }))

  if (changed) {
    await Product.updateOne({ _id: product._id }, { $set: { variants: variants } })
    product.variants = variants
  }

  return changed
}

const listProducts = async (query) => {
  const find = { deleted: false }
  if (query.status) find.status = query.status

  if (query.keyword) {
    find.title = searchHelper(query)
  }

  const totalProduct = await Product.countDocuments(find)
  const pagination = paginationHelper(query, totalProduct, {
    currentPage: 1,
    limitItem: 4
  })

  const sort = {}
  if (query.sortKey && query.sortValue) {
    sort[query.sortKey] = query.sortValue
  } else {
    sort.position = "desc"
  }

  const products = await Product.find(find)
    .limit(pagination.limitItem)
    .skip(pagination.skip)
    .sort(sort)
    .lean()

  await attachActorNames(products)

  return {
    products: products,
    filterStatus: filterStatusHelper(query),
    keyword: query.keyword,
    pagination: pagination
  }
}

const changeStatus = async ({ id, status, adminId }) => {
  const updatedBy = {
    account_id: adminId,
    updatedAt: new Date()
  }

  await Product.updateOne(
    { _id: id },
    {
      $set: { status },
      $push: { updatedBy: updatedBy }
    }
  )

  logAction('product', 'change_status', `Đổi trạng thái sản phẩm ${id}: ${status}`, { productId: id, status, adminId })
  await clearCategoryCache()
}

const changeMulti = async ({ type, ids, adminId }) => {
  const updatedBy = {
    account_id: adminId,
    updatedAt: new Date()
  }

  switch (type) {
    case "active":
      await Product.updateMany({ _id: { $in: ids } }, { $set: { status: "active" }, $push: { updatedBy: updatedBy } })
      logAction('product', 'change_multi', `Kích hoạt ${ids.length} sản phẩm`, { ids, type, adminId })
      break
    case "inactive":
      await Product.updateMany({ _id: { $in: ids } }, { $set: { status: "inactive" }, $push: { updatedBy: updatedBy } })
      logAction('product', 'change_multi', `Vô hiệu ${ids.length} sản phẩm`, { ids, type, adminId })
      break
    case "delete-all":
      await Product.updateMany(
        { _id: { $in: ids } },
        {
          deleted: true,
          deletedBy: {
            account_id: adminId,
            deletedAt: new Date()
          }
        }
      )
      logAction('product', 'delete_multi', `Xóa ${ids.length} sản phẩm`, { ids, type, adminId })
      break
    case "change-position": {
      // Gom nhiều lệnh updateOne thành 1 bulkWrite thay vì await trong vòng lặp
      const operations = ids.map(item => {
        const [id, position] = item.split("-")
        return {
          updateOne: {
            filter: { _id: id },
            update: {
              $set: { position: parseInt(position) },
              $push: { updatedBy: updatedBy }
            }
          }
        }
      })
      if (operations.length > 0) await Product.bulkWrite(operations)
      logAction('product', 'change_multi', `Cập nhật vị trí ${ids.length} sản phẩm`, { ids, type, adminId })
      break
    }
    default:
      break
  }

  await clearCategoryCache()
}

const softDelete = async ({ id, adminId }) => {
  await Product.updateOne(
    { _id: id },
    {
      deleted: true,
      deletedBy: {
        account_id: adminId,
        deletedAt: new Date()
      }
    }
  )

  logAction('product', 'delete', `Xóa sản phẩm: ${id}`, { productId: id, adminId })
  await clearCategoryCache()
}

const getCreateForm = async () => {
  const category = await ProductCategory.find({ deleted: false })
  return { category: createTreeHelper.tree(category) }
}

const createProduct = async ({ body, adminId }) => {
  const payload = { ...body }

  if (payload.position) {
    payload.position = parseInt(payload.position)
  } else {
    const countProduct = await Product.countDocuments()
    payload.position = countProduct + 1
  }

  if (payload.variants) {
    payload.variants = await normalizeVariantThumbnails(
      JSON.parse(payload.variants),
      payload.variantThumbnails
    )
    delete payload.variantThumbnails
  }

  payload.createdBy = {
    account_id: adminId
  }

  const product = new Product(payload)
  await product.save()

  logAction('product', 'create', `Tạo sản phẩm: ${product.title}`, { productId: product.id, adminId })
  await clearCategoryCache()
}

const getEditForm = async (id) => {
  const product = await Product.findOne({ _id: id })
  if (!product) throw httpError(404, "Không tìm thấy sản phẩm")

  // Tự động upload ảnh biến thể từ URL ngoài lên Cloudinary
  await migrateVariantThumbnails(product)

  const category = await ProductCategory.find({ deleted: false })

  return {
    product: product,
    category: createTreeHelper.tree(category)
  }
}

const updateProduct = async ({ id, body, adminId }) => {
  const payload = { ...body }

  if (payload.position !== undefined) {
    payload.position = parseInt(payload.position)
  }

  if (payload.variants) {
    payload.variants = await normalizeVariantThumbnails(
      JSON.parse(payload.variants),
      payload.variantThumbnails
    )
    delete payload.variantThumbnails
  }

  const updatedBy = {
    account_id: adminId,
    updatedAt: new Date()
  }

  await Product.updateOne(
    { _id: id },
    {
      $set: payload,
      $push: { updatedBy: updatedBy }
    }
  )

  logAction('product', 'update', `Cập nhật sản phẩm: ${id}`, { productId: id, adminId })
  await clearCategoryCache()
}

const getDetail = async (id) => {
  const product = await Product.findOne({ _id: id, deleted: false })
  if (!product) throw httpError(404, "Không tìm thấy sản phẩm")

  return { product: product }
}

const updatePosition = async ({ id, position, adminId }) => {
  const updatedBy = {
    account_id: adminId,
    updatedAt: new Date()
  }

  await Product.updateOne(
    { _id: id },
    {
      $set: { position: parseInt(position) },
      $push: { updatedBy: updatedBy }
    }
  )

  await clearCategoryCache()
}

const listActiveProducts = async (query) => {
  const find = {
    deleted: false,
    status: "active"
  }

  if (query.keyword) {
    find.title = searchHelper(query)
  }

  const totalItem = await Product.countDocuments(find)
  const pagination = paginationHelper(query, totalItem, {
    currentPage: 1,
    limitItem: 6
  })

  const products = await Product.find(find)
    .limit(pagination.limitItem)
    .skip(pagination.skip)
    .sort({ position: "desc" })

  return { products: priceNewProducts(products), pagination: pagination }
}

const listProductsByCategorySlug = async ({ slug, query }) => {
  const category = await ProductCategory.findOne({ slug: slug, deleted: false })
  if (!category) throw httpError(404, "Không tìm thấy danh mục sản phẩm")

  const listSubCategory = await productsCategoryHelper.getSubCategory(category._id)
  const listSubCategoryId = listSubCategory.map(item => item._id)

  const find = {
    product_category_id: { $in: [category._id, ...listSubCategoryId] },
    deleted: false,
    status: "active"
  }

  const totalItem = await Product.countDocuments(find)
  const pagination = paginationHelper(query, totalItem, {
    currentPage: 1,
    limitItem: 6
  })

  const products = await Product.find(find)
    .limit(pagination.limitItem)
    .skip(pagination.skip)
    .sort({ position: "desc" })

  return { products: priceNewProducts(products), pagination: pagination }
}

// Đọc cache danh sách sản phẩm theo danh mục, ghi cache sau khi tính.
// Đặt suffix :v2 vì cache cũ lưu nguyên envelope {code,message,data}, khác với shape data thuần.
const getCachedCategoryProducts = async ({ slug, query }) => {
  const page = query.page || 1
  const cacheKey = `products:category:${slug}:page:${page}:v2`

  try {
    const cached = await redis.get(cacheKey)
    if (cached) return JSON.parse(cached)
  } catch {} // Redis unavailable → đọc thẳng từ database

  const data = await listProductsByCategorySlug({ slug, query })

  try {
    await redis.set(cacheKey, JSON.stringify(data), 'EX', CATEGORY_CACHE_TTL_SECONDS)
  } catch {} // Redis unavailable → bỏ qua ghi cache

  return data
}

const getProductDetailBySlug = async (slug) => {
  const product = await Product.findOne({
    slug: slug,
    deleted: false,
    status: "active"
  })

  if (!product) throw httpError(404, "Không tìm thấy sản phẩm")

  product.priceNew = priceNewProduct(product)

  if (product.product_category_id) {
    product.category = await ProductCategory.findOne({
      _id: product.product_category_id,
      deleted: false,
      status: "active"
    })
  }

  return { product: product }
}

module.exports = {
  attachActorNames,
  normalizeVariantThumbnails,
  listProducts,
  changeStatus,
  changeMulti,
  softDelete,
  getCreateForm,
  createProduct,
  getEditForm,
  updateProduct,
  getDetail,
  updatePosition,
  listActiveProducts,
  listProductsByCategorySlug,
  getCachedCategoryProducts,
  getProductDetailBySlug
}
