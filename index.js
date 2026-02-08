const express = require('express')
const app = express()
require('dotenv').config()
const port = process.env.PORT
const path = require("path") 
const systemConfig = require("./config/system")

const moment = require("moment")
app.locals.moment = moment


// Flash
const  session = require('express-session')
const cookieParser = require('cookie-parser')
var flash = require('express-flash')
app.use(cookieParser('keyboard cat')) // lưu vào trong cookie
app.use(session({
  secret: 'keyboard cat', // ❗ bắt buộc phải có
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 60000
  }
}))
app.use(flash())
// End Flash

// Tiny MCE
app.use('/tinymce', express.static(path.join(__dirname,'node_modules','tinymce')))
// End Tiny MCE

const route = require("./routes/client/index.route")
const routeAdmin = require("./routes/admin/index.route")

app.set("views", `${__dirname}/views`)
app.set("view engine", "pug")

app.use(express.static(`${__dirname}/public`)) // Sử dụng được file public

// Kết nối database
const database = require("./config/database")
database.connect()
// End kết nối database

const mongoose = require("mongoose")
var slug = require("mongoose-slug-updater")
mongoose.plugin(slug)


var methodOverride = require('method-override')
app.use(methodOverride('_method'))


const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended : false}))

route(app)
routeAdmin(app)

app.use((req,res)=>{
  res.status(404).render("client/pages/errors/404",{
    pagetitle: "404 Not Found"
  })
})

app.locals.prefixAdmin = systemConfig.prefixAdmin // sử dụng trong các file pug

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
