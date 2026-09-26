const productService = require("../../services/product.service")
const { logger } = require("../../helpers/logger")
const httpError = require("../../helpers/httpError")

// [GET]: /products
module.exports.index = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Thành công",
      data: await productService.listActiveProducts(req.query)
    })
  } catch (error) {
    logger.error('Lỗi lấy danh sách sản phẩm', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Lỗi lấy danh sách sản phẩm")
    res.status(statusCode).json(body)
  }
}

// [GET]: /products/:slugCategory
module.exports.category = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Thành công",
      data: await productService.getCachedCategoryProducts({
        slug: req.params.slugCategory,
        query: req.query
      })
    })
  } catch (error) {
    logger.error('Lỗi lấy sản phẩm theo danh mục', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Không tìm thấy danh mục sản phẩm")
    res.status(statusCode).json(body)
  }
}

// [GET]: /products/detail/:slugProduct
module.exports.detail = async (req, res) => {
  try {
    res.json({
      code: 200,
      message: "Thành công",
      data: await productService.getProductDetailBySlug(req.params.slugProduct)
    })
  } catch (error) {
    logger.error('Lỗi lấy chi tiết sản phẩm', { error: error.message, stack: error.stack })
    const { statusCode, body } = httpError.toResponse(error, "Không tìm thấy sản phẩm")
    res.status(statusCode).json(body)
  }
}
