const redis = require("../config/redis")

const CACHE_TIMEOUT_MS = 2000

// Các pattern cache liên quan tới danh mục/sản phẩm.
// products:category:* -> cache danh sách sản phẩm theo danh mục (client/product)
// category:subs:*      -> cache danh sách danh mục con (helpers/products-category)
const CATEGORY_CACHE_PATTERNS = ["products:category:*", "category:subs:*"]

// Xoá toàn bộ cache danh mục. Trước đây có 2 bản khác nhau nằm trong 2 controller,
// bản của product-category không có timeout guard nên Redis chết là sập luôn thao tác danh mục.
const clearCategoryCache = async () => {
  try {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), CACHE_TIMEOUT_MS))
    const results = await Promise.race([
      Promise.all(CATEGORY_CACHE_PATTERNS.map(pattern => redis.keys(pattern))),
      timeout
    ])
    const keys = results.flat()
    if (keys.length > 0) await redis.del(...keys)
  } catch {} // Redis unavailable → skip cache clear
}

module.exports = { clearCategoryCache, CATEGORY_CACHE_PATTERNS, CACHE_TIMEOUT_MS }
