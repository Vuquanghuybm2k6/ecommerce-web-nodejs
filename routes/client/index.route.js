const homeRoutes = require("./home.route")
const productRoutes = require("./product.route")
const searchRoutes = require("./search.route")
const cartRoutes = require("./cart.route")
const cartMiddleware = require("../../middlewares/client/cart.middleware")
const categoryMiddleware = require("../../middlewares/client/category.middleware")
module.exports = (app) =>{
  app.use(categoryMiddleware.category)
  app.use(cartMiddleware.cartId)
  app.use("/", homeRoutes)
  app.use("/products", productRoutes)
  app.use("/search", searchRoutes)
  app.use("/cart", cartRoutes)
}