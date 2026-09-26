const productService = require("../../services/product.service")
const { logger } = require("../../helpers/logger")
const httpError = require("../../helpers/httpError")

// [GET]: /admin/products
module.exports.index = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Thành công",
      data: await productService.listProducts(req.query)
    })
  } catch (error) {
    logger.error('Lỗi lấy danh sách sản phẩm', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi lấy danh sách sản phẩm")
    res.status(statusCode).json(body)
  }
}

// [PATCH]: /admin/products/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {
  try {
    await productService.changeStatus({
      id: req.params.id,
      status: req.params.status,
      adminId: req.user.id
    })

    res.json({
      code: 200,
      message: "Cập nhật trạng thái thành công"
    })
  } catch (error) {
    logger.error('Lỗi đổi trạng thái sản phẩm', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Cập nhật trạng thái thất bại")
    res.status(statusCode).json(body)
  }
}

// [PATCH]: /admin/products/change-multi
module.exports.changeMulti = async (req, res) => {
  try {
    await productService.changeMulti({
      type: req.body.type,
      ids: req.body.ids.split(", ").map(id => id.trim()),
      adminId: req.user.id
    })

    res.json({
      code: 200,
      message: "Thao tác thành công"
    })
  } catch (error) {
    logger.error('Lỗi thao tác hàng loạt sản phẩm', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Thao tác thất bại")
    res.status(statusCode).json(body)
  }
}

//[PATCH]: /admin/products/delete/:id
module.exports.delete = async (req, res) => {
  try {
    await productService.softDelete({ id: req.params.id, adminId: req.user.id })

    res.json({
      code: 200,
      message: "Thao tác thành công"
    })
  } catch (error) {
    logger.error('Lỗi xóa sản phẩm', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Xóa sản phẩm thất bại")
    res.status(statusCode).json(body)
  }
}

// [GET]: /admin/products/create
module.exports.create = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Thành công",
      data: await productService.getCreateForm()
    })
  } catch (error) {
    logger.error('Lỗi tải form tạo sản phẩm', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi tải danh mục sản phẩm")
    res.status(statusCode).json(body)
  }
}

// [POST]: /admin/products/create
module.exports.createPost = async (req, res) => {
  try {
    await productService.createProduct({ body: req.body, adminId: req.user.id })

    res.json({
      code: 200,
      message: "Tạo mới sản phẩm thành công"
    })
  } catch (error) {
    logger.error('Lỗi tạo sản phẩm', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Tạo mới sản phẩm thất bại")
    res.status(statusCode).json(body)
  }
}

// [GET]: /admin/products/edit/:id
module.exports.edit = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Thành công",
      data: await productService.getEditForm(req.params.id)
    })
  } catch (error) {
    logger.error('Lỗi tải form sửa sản phẩm', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi tải sản phẩm")
    res.status(statusCode).json(body)
  }
}

// [PATCH]: /admin/products/edit/:id
module.exports.editPatch = async (req, res) => {
  try {
    await productService.updateProduct({
      id: req.params.id,
      body: req.body,
      adminId: req.user.id
    })

    res.json({
      code: 200,
      message: "Cập nhật thành công sản phẩm"
    })
  } catch (error) {
    logger.error('Lỗi cập nhật sản phẩm', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Cập nhật sản phẩm thất bại")
    res.status(statusCode).json(body)
  }
}

// [GET]: /admin/products/detail
module.exports.detail = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Thành công",
      data: await productService.getDetail(req.params.id)
    })
  } catch (error) {
    logger.error('Lỗi lấy chi tiết sản phẩm', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi lấy chi tiết sản phẩm")
    res.status(statusCode).json(body)
  }
}

// [GET]: /admin/products/update-position
module.exports.update = async (req, res) => {
  try {
    await productService.updatePosition({
      id: req.params.id,
      position: req.params.position,
      adminId: req.user.id
    })

    res.json({
      code: 200,
      message: "Cập nhật vị trí thành công"
    })
  } catch (error) {
    logger.error('Lỗi cập nhật vị trí sản phẩm', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Cập nhật vị trí thất bại")
    res.status(statusCode).json(body)
  }
}
