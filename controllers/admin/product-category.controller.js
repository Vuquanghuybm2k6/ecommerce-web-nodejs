const categoryService = require("../../services/category.service")
const { logger } = require("../../helpers/logger")
const httpError = require("../../helpers/httpError")

// [GET]: /admin/products-category
module.exports.index = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Thành công",
      data: await categoryService.listCategories()
    })
  } catch (error) {
    logger.error('Lỗi lấy danh sách danh mục', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi lấy danh sách danh mục")
    res.status(statusCode).json(body)
  }
}

// [GET]: /admin/products-category/create
module.exports.create = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Thành công",
      data: await categoryService.getCreateForm()
    })
  } catch (error) {
    logger.error('Lỗi tải form tạo danh mục', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi lấy danh sách danh mục")
    res.status(statusCode).json(body)
  }
}

// [POST]: /admin/products-category/create
module.exports.createPost = async (req, res) => {
  try {
    await categoryService.createCategory({ body: req.body, adminId: req.user.id })

    res.json({
      code: 200,
      message: "Tạo mới danh mục sản phẩm thành công"
    })
  } catch (error) {
    logger.error('Lỗi tạo danh mục', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Tạo danh mục thất bại")
    res.status(statusCode).json(body)
  }
}

// [GET]: /admin/products-category/edit/:id
module.exports.edit = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Thành công",
      data: await categoryService.getEditForm(req.params.id)
    })
  } catch (error) {
    logger.error('Lỗi tải form sửa danh mục', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi lấy danh mục")
    res.status(statusCode).json(body)
  }
}

// [PATCH]: /admin/products-category/edit/:id
module.exports.editPatch = async (req, res) => {
  try {
    const { title } = await categoryService.updateCategory({
      id: req.params.id,
      body: req.body,
      adminId: req.user.id
    })

    res.json({
      code: 200,
      message: `Cập nhật danh mục ${title} thành công`
    })
  } catch (error) {
    logger.error('Lỗi cập nhật danh mục', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Cập nhật danh mục thất bại")
    res.status(statusCode).json(body)
  }
}

// [GET]: /admin/products-category/detail/:id
module.exports.detail = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Thành công",
      data: await categoryService.getDetail(req.params.id)
    })
  } catch (error) {
    logger.error('Lỗi lấy chi tiết danh mục', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi lấy chi tiết danh mục")
    res.status(statusCode).json(body)
  }
}

// [PATCH]: /admin/products-category/delete/:id
module.exports.delete = async (req, res) => {
  try {
    await categoryService.softDelete({ id: req.params.id, adminId: req.user.id })

    res.json({
      code: 200,
      message: "Xóa thành công danh mục sản phẩm"
    })
  } catch (error) {
    logger.error('Lỗi xóa danh mục', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Xóa danh mục thất bại")
    res.status(statusCode).json(body)
  }
}
