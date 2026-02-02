const homeRoutes = require("./home.route")
const productRoutes = require("./product.route")
const searchRoutes = require("./search.route")
const categoryMiddleWare = require("../../middlewares/client/category.middleware")
module.exports = (app) =>{
  app.use("/", homeRoutes)
  app.use("/products", categoryMiddleWare.category, productRoutes)
  app.use("/search", categoryMiddleWare.category, searchRoutes)
}