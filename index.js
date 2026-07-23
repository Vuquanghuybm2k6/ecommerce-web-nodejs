const express = require('express')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 3000
const path = require("path")
const systemConfig = require("./config/system")
const cors = require('cors')
const morgan = require('morgan')
const { logger } = require('./helpers/logger')

const morganStream = { write: (message) => logger.info(message.trim(), { category: 'http' }) }


app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    const normalizedOrigin = origin.replace(/\/$/, '')
    const allowedOrigin = (process.env.FRONTEND_URL || '').replace(/\/$/, '')
    if (normalizedOrigin === allowedOrigin || normalizedOrigin.endsWith('.vercel.app')) {
      return callback(null, true)
    }
    callback(null, false)
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const cookieParser = require('cookie-parser')
app.use(cookieParser())

app.use(morgan('combined', { stream: morganStream }))

app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')))

const database = require("./config/database")
database.connect()

const mongoose = require("mongoose")
var slug = require("mongoose-slug-updater")
mongoose.plugin(slug)

const passport = require("./helpers/oauth.helper")
app.use(passport.initialize())

// Swagger
const swaggerUi = require('swagger-ui-express')
const swaggerSpec = require('./config/swagger')
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }))

const route = require("./routes/client/index.route")
const routeAdmin = require("./routes/admin/index.route")
route(app)
routeAdmin(app)

app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: "Not Found"
  })
})

app.use((err, req, res, next) => {
  logger.error(err.message, {
    category: 'error',
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  })
  res.status(500).json({
    code: 500,
    message: "Internal Server Error"
  })
})

app.listen(port, () => {
    logger.info(`API server listening on port ${port}`)
})
