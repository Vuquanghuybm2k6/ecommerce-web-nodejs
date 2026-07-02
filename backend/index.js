const express = require('express')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 3000
const path = require("path")
const systemConfig = require("./config/system")
const cors = require('cors')


app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const cookieParser = require('cookie-parser')
app.use(cookieParser())

app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')))

const database = require("./config/database")
database.connect()

const mongoose = require("mongoose")
var slug = require("mongoose-slug-updater")
mongoose.plugin(slug)

const passport = require("./helpers/oauth.helper")
app.use(passport.initialize())

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
  console.error(err)
  res.status(500).json({
    code: 500,
    message: "Internal Server Error"
  })
})

app.listen(port, () => {
  console.log(`API server listening on port ${port}`)
})
