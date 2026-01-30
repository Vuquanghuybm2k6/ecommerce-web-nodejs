const homeRoutes = require("./home.route")
const productRoutes = require("./product.route")
const categoryMiddleWare = require("../../middlewares/client/category.middleware")
module.exports = (app) =>{
  app.use("/", homeRoutes)
  app.use("/products", categoryMiddleWare.category, productRoutes)
}