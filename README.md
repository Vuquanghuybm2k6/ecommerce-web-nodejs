# 🛒 Product Management Website

Product Management Website is a fullstack e-commerce management system built with Node.js, Express.js, MongoDB, and Pug Template Engine.

The project supports product management, category management, authentication, authorization, shopping cart, order system, user management, and admin dashboard features.

---

# 🌐 Live Demo

## Client Site

https://ecommerce-web-nodejs.vercel.app/

## Admin Dashboard

https://ecommerce-web-nodejs.vercel.app/admin/auth/login 

---

# 🔑 Demo Account

## Admin Account

* Email: vuquanghuybm2k6
* Password: 1

## User Account

* Email: vuquanghuybm2k6
* Password: 1

---

# 📸 Screenshots

## Home Page

![Home](<img width="1899" height="1028" alt="image" src="https://github.com/user-attachments/assets/8110373c-bbc3-4928-a91c-0b4f899b21fa" />)

## Product Detail

![Product Detail](./screenshots/product-detail.png)

## Admin Dashboard

![Admin Dashboard](./screenshots/admin-dashboard.png)

---

# 🚀 Features

## 🛠️ Admin Features

### Product Management

* Create, edit, delete products
* Soft delete products
* Bulk update product status
* Product filtering, searching, sorting
* Product pagination
* Featured products
* Product slug generation

### Category Management

* Nested category system
* Recursive category tree rendering
* Create, edit, delete categories

### Role & Permission Management

* Role-based authorization
* Permission management
* Admin account management
* Route protection middleware

### System Features

* Upload images with Multer
* Upload images to Cloudinary
* TinyMCE rich text editor
* Flash notification messages
* Activity logging system
* General website settings

---

## 🛍️ Client Features

### Product Features

* Product listing
* Product detail page
* Featured products
* Newest products
* Product search
* Product filtering by category

### Shopping Cart

* Add products to cart
* Update cart quantity
* Remove products from cart
* Mini cart system

### Checkout & Orders

* Checkout page
* Order management
* Order success page

### User Authentication

* User registration
* Login / logout
* Forgot password with OTP verification
* Reset password

---

# ✨ Technical Highlights

* MVC architecture pattern
* RESTful routing structure
* Authentication & Authorization
* Role-based access control (RBAC)
* Recursive category tree rendering
* Middleware-based validation
* MongoDB schema modeling
* Server-side rendering with Pug
* Cloudinary image upload
* Cookie & session management

---

# 🏗️ Architecture

```text
Client Browser
      ↓
Express.js Server
      ↓
Controllers → MongoDB
      ↓
Pug Template Rendering
```

## Architecture Overview

* Express.js handles routing and middleware
* MongoDB stores products, users, categories, carts, and orders
* Pug is used for server-side rendering
* Middleware handles authentication, authorization, validation, and flash messages
* Cloudinary stores uploaded product images

---

# 🔄 System Workflow

## Product Management Flow

1. Admin logs into dashboard
2. Admin creates or edits products
3. Product data is validated
4. Images are uploaded to Cloudinary
5. Product data is stored in MongoDB
6. Client-side pages render updated products

## Shopping Cart Flow

1. User adds product to cart
2. Cart data is stored using cookies + MongoDB
3. User updates quantity or removes items
4. Checkout creates order records
5. Order success page displays purchase information

---

# 🧱 Tech Stack

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose

## Frontend

* Pug Template Engine
* HTML
* CSS
* JavaScript
* Bootstrap

## Additional Libraries

* Multer
* Cloudinary
* TinyMCE
* Nodemailer
* express-session
* express-flash
* cookie-parser
* dotenv
* mongoose-slug-updater
* method-override

---

# 📁 Project Structure

```bash
project-product-management/
│
├── config/
├── controllers/
├── helpers/
├── middlewares/
├── models/
├── public/
├── routes/
├── validates/
├── views/
│
├── .env
├── index.js
├── package.json
└── README.md
```

---

# 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=3000

# Database
MONGO_URL=your_mongodb_connection_string

# Cloudinary
CLOUD_NAME=your_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret

# Email Service
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_app_password
```

> Example values only. Do not use real production credentials.

---

# ▶️ Installation

Clone the repository:

```bash
git clone https://github.com/your-username/project-product-management.git
```

Move to project directory:

```bash
cd project-product-management
```

Install dependencies:

```bash
npm install
```

---

# ▶️ Run Project

Run in development mode:

```bash
npm run dev
```

Run in production mode:

```bash
npm start
```

---

# 👨‍💻 Author

* Name: Vu Quang Huy
* Project: Product Management Website
* Year: 2026
