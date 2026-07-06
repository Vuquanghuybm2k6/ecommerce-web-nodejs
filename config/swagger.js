const swaggerJsdoc = require('swagger-jsdoc')

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Product Management API',
      version: '1.0.0',
      description: 'API for Product Management System with client and admin interfaces',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        CartId: {
          type: 'apiKey',
          in: 'header',
          name: 'x-cart-id',
          description: 'Cart ID for guest user cart management',
        },
      },
      schemas: {
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            product_category_id: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            discountPercentage: { type: 'number' },
            stock: { type: 'number' },
            thumbnail: { type: 'string' },
            status: { type: 'string', enum: ['active', 'inactive'] },
            position: { type: 'number' },
            featured: { type: 'string' },
            slug: { type: 'string' },
            priceNew: { type: 'number', description: 'Price after discount' },
            category: { '$ref': '#/components/schemas/ProductCategory' },
            deleted: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ProductCategory: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            parent_id: { type: 'string' },
            description: { type: 'string' },
            thumbnail: { type: 'string' },
            status: { type: 'string', enum: ['active', 'inactive'] },
            position: { type: 'number' },
            slug: { type: 'string' },
            deleted: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Cart: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user_id: { type: 'string' },
            products: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product_id: { type: 'string' },
                  quantity: { type: 'number' },
                  productInfo: { '$ref': '#/components/schemas/ProductInfo' },
                  totalPrice: { type: 'number' },
                },
              },
            },
            totalPrice: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ProductInfo: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            thumbnail: { type: 'string' },
            slug: { type: 'string' },
            price: { type: 'number' },
            priceNew: { type: 'number' },
            discountPercentage: { type: 'number' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            cart_id: { type: 'string' },
            userInfo: {
              type: 'object',
              properties: {
                fullName: { type: 'string' },
                phone: { type: 'string' },
                address: { type: 'string' },
              },
            },
            products: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product_id: { type: 'string' },
                  price: { type: 'number' },
                  discountPercentage: { type: 'number' },
                  priceNew: { type: 'number' },
                  quantity: { type: 'number' },
                  productInfo: { '$ref': '#/components/schemas/ProductInfo' },
                  totalPrice: { type: 'number' },
                },
              },
            },
            status: { type: 'string', enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] },
            totalPrice: { type: 'number' },
            orderCode: { type: 'string' },
            user_id: { type: 'string' },
            paymentMethod: { type: 'string' },
            shippingMethod: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            fullName: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            avatar: { type: 'string' },
            authType: { type: 'string', enum: ['local', 'google'] },
            status: { type: 'string', enum: ['active', 'inactive'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Account: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            fullName: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            avatar: { type: 'string' },
            role_id: { type: 'string' },
            authType: { type: 'string', enum: ['local', 'google'] },
            status: { type: 'string', enum: ['active', 'inactive'] },
            token: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Role: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            permissions: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            code: { type: 'number' },
            message: { type: 'string' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            currentPage: { type: 'number' },
            limitItem: { type: 'number' },
            totalItem: { type: 'number' },
            skip: { type: 'number' },
            totalPage: { type: 'number' },
          },
        },
        Setting: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            siteName: { type: 'string' },
            logo: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            address: { type: 'string' },
            copyright: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'Client - Home', description: 'Home page' },
      { name: 'Client - Products', description: 'Product listing and details' },
      { name: 'Client - Search', description: 'Product search' },
      { name: 'Client - Cart', description: 'Shopping cart management' },
      { name: 'Client - Checkout', description: 'Checkout and order placement' },
      { name: 'Client - Auth', description: 'User authentication (register, login, OAuth)' },
      { name: 'Client - User', description: 'User profile management' },
      { name: 'Admin - Auth', description: 'Admin authentication' },
      { name: 'Admin - Dashboard', description: 'Admin dashboard statistics' },
      { name: 'Admin - Products', description: 'Admin product management (CRUD)' },
      { name: 'Admin - Categories', description: 'Admin product category management' },
      { name: 'Admin - Roles', description: 'Admin role & permissions management' },
      { name: 'Admin - Accounts', description: 'Admin account management' },
      { name: 'Admin - My Account', description: 'Admin profile management' },
      { name: 'Admin - Settings', description: 'General settings' },
    ],
    paths: {
      // ───────── CLIENT: Home ─────────
      '/api': {
        get: {
          tags: ['Client - Home'],
          summary: 'Get home page data',
          responses: {
            200: { description: 'Home page data', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ApiResponse' } } } },
          },
        },
      },

      // ───────── CLIENT: Products ─────────
      '/api/products': {
        get: {
          tags: ['Client - Products'],
          summary: 'Get active products with pagination and search',
          parameters: [
            { name: 'keyword', in: 'query', schema: { type: 'string' }, description: 'Search keyword' },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
          ],
          responses: {
            200: { description: 'List of products with pagination', content: { 'application/json': { schema: { type: 'object', properties: { code: { type: 'number' }, message: { type: 'string' }, data: { type: 'object', properties: { products: { type: 'array', items: { '$ref': '#/components/schemas/Product' } }, pagination: { '$ref': '#/components/schemas/Pagination' } } } } } } } },
          },
        },
      },
      '/api/products/detail/{slug}': {
        get: {
          tags: ['Client - Products'],
          summary: 'Get product detail by slug',
          parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Product detail', content: { 'application/json': { schema: { type: 'object', properties: { code: { type: 'number' }, message: { type: 'string' }, data: { type: 'object', properties: { product: { '$ref': '#/components/schemas/Product' } } } } } } } },
          },
        },
      },
      '/api/products/{slugCategory}': {
        get: {
          tags: ['Client - Products'],
          summary: 'Get products by category slug',
          parameters: [
            { name: 'slugCategory', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          ],
          responses: {
            200: { description: 'Products filtered by category', content: { 'application/json': { schema: { type: 'object', properties: { code: { type: 'number' }, message: { type: 'string' }, data: { type: 'object', properties: { products: { type: 'array', items: { '$ref': '#/components/schemas/Product' } }, pagination: { '$ref': '#/components/schemas/Pagination' } } } } } } } },
            400: { description: 'Category not found' },
          },
        },
      },

      // ───────── CLIENT: Search ─────────
      '/api/search': {
        get: {
          tags: ['Client - Search'],
          summary: 'Search products by keyword',
          parameters: [
            { name: 'keyword', in: 'query', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Search results', content: { 'application/json': { schema: { type: 'object', properties: { code: { type: 'number' }, message: { type: 'string' }, data: { type: 'object', properties: { products: { type: 'array', items: { '$ref': '#/components/schemas/Product' } }, keyword: { type: 'string' } } } } } } } },
          },
        },
      },

      // ───────── CLIENT: Cart ─────────
      '/api/cart': {
        get: {
          tags: ['Client - Cart'],
          summary: 'Get current cart contents',
          parameters: [{ name: 'x-cart-id', in: 'header', schema: { type: 'string' }, description: 'Cart ID from cookie' }],
          responses: {
            200: { description: 'Cart data with enriched product info', content: { 'application/json': { schema: { type: 'object', properties: { code: { type: 'number' }, message: { type: 'string' }, data: { type: 'object', properties: { cart: { '$ref': '#/components/schemas/Cart' } } } } } } } },
          },
        },
      },
      '/api/cart/add/{productId}': {
        post: {
          tags: ['Client - Cart'],
          summary: 'Add product to cart',
          parameters: [
            { name: 'productId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'x-cart-id', in: 'header', schema: { type: 'string' } },
          ],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { quantity: { type: 'integer', default: 1 } } } } } },
          responses: {
            200: { description: 'Product added to cart' },
            400: { description: 'Validation error (quantity, stock)' },
          },
        },
      },
      '/api/cart/delete/{productId}': {
        delete: {
          tags: ['Client - Cart'],
          summary: 'Remove product from cart',
          parameters: [
            { name: 'productId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'x-cart-id', in: 'header', schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Product removed from cart' },
          },
        },
      },
      '/api/cart/update/{productId}': {
        put: {
          tags: ['Client - Cart'],
          summary: 'Update product quantity in cart',
          parameters: [
            { name: 'productId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'x-cart-id', in: 'header', schema: { type: 'string' } },
          ],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { quantity: { type: 'integer' } } } } } },
          responses: {
            200: { description: 'Quantity updated' },
            400: { description: 'Validation error' },
          },
        },
      },

      // ───────── CLIENT: Checkout ─────────
      '/api/checkout': {
        get: {
          tags: ['Client - Checkout'],
          summary: 'Get checkout data (requires auth, non-empty cart)',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'x-cart-id', in: 'header', schema: { type: 'string' } }],
          responses: {
            200: { description: 'Checkout cart detail' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/checkout/order': {
        post: {
          tags: ['Client - Checkout'],
          summary: 'Place an order',
          security: [{ BearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['fullName', 'phone', 'address'], properties: { fullName: { type: 'string' }, phone: { type: 'string' }, address: { type: 'string' }, paymentMethod: { type: 'string', default: 'COD' }, shippingMethod: { type: 'string' } } } } } },
          responses: {
            200: { description: 'Order placed successfully', content: { 'application/json': { schema: { type: 'object', properties: { code: { type: 'number' }, message: { type: 'string' }, data: { type: 'object', properties: { orderId: { type: 'string' }, orderCode: { type: 'string' } } } } } } } },
            401: { description: 'Unauthorized' },
            400: { description: 'Validation error or empty cart' },
          },
        },
      },
      '/api/checkout/success/{orderId}': {
        get: {
          tags: ['Client - Checkout'],
          summary: 'Get order success details',
          parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Order details', content: { 'application/json': { schema: { type: 'object', properties: { code: { type: 'number' }, message: { type: 'string' }, data: { type: 'object', properties: { order: { '$ref': '#/components/schemas/Order' } } } } } } } },
          },
        },
      },

      // ───────── CLIENT: Auth ─────────
      '/api/auth/google': {
        get: {
          tags: ['Client - Auth'],
          summary: 'Google OAuth login',
          responses: { 302: { description: 'Redirect to Google OAuth' } },
        },
      },
      '/api/auth/google/callback': {
        get: {
          tags: ['Client - Auth'],
          summary: 'Google OAuth callback',
          responses: { 302: { description: 'Redirect to frontend with tokens' } },
        },
      },

      // ───────── CLIENT: User ─────────
      '/api/user/register': {
        get: { tags: ['Client - Auth'], summary: 'Register page', responses: { 200: { description: 'Register page' } } },
        post: {
          tags: ['Client - Auth'],
          summary: 'Register a new user',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password', 'fullName'], properties: { fullName: { type: 'string' }, email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password' } } } } } },
          responses: {
            200: { description: 'Registration successful with tokens and cart', content: { 'application/json': { schema: { type: 'object', properties: { code: { type: 'number' }, message: { type: 'string' }, data: { type: 'object', properties: { user: { type: 'object', properties: { id: { type: 'string' }, email: { type: 'string' } } }, cartId: { type: 'string' }, accessToken: { type: 'string' }, refreshToken: { type: 'string' } } } } } } } },
            400: { description: 'Email already exists' },
          },
        },
      },
      '/api/user/login': {
        get: { tags: ['Client - Auth'], summary: 'Login page', responses: { 200: { description: 'Login page' } } },
        post: {
          tags: ['Client - Auth'],
          summary: 'Login with email and password',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string' }, password: { type: 'string' } } } } } },
          responses: {
            200: { description: 'Login successful with tokens and cart' },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/api/user/logout': {
        post: {
          tags: ['Client - Auth'],
          summary: 'Logout (revoke refresh token)',
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { refreshToken: { type: 'string' } } } } } },
          responses: { 200: { description: 'Logged out' } },
        },
      },
      '/api/user/refresh-token': {
        post: {
          tags: ['Client - Auth'],
          summary: 'Refresh access token',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } } } } },
          responses: { 200: { description: 'New tokens issued' }, 401: { description: 'Invalid/expired refresh token' } },
        },
      },
      '/api/user/password/forgot': {
        get: { tags: ['Client - User'], summary: 'Forgot password page', responses: { 200: { description: 'Forgot password page' } } },
        post: {
          tags: ['Client - User'],
          summary: 'Send OTP to email for password reset',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string' } } } } } },
          responses: { 200: { description: 'OTP sent' }, 400: { description: 'Email not found' } },
        },
      },
      '/api/user/password/otp': {
        get: { tags: ['Client - User'], summary: 'OTP verification page', responses: { 200: { description: 'OTP page' } } },
        post: {
          tags: ['Client - User'],
          summary: 'Verify OTP',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'otp'], properties: { email: { type: 'string' }, otp: { type: 'string' } } } } } },
          responses: { 200: { description: 'OTP verified, tokens returned' }, 400: { description: 'Invalid OTP' } },
        },
      },
      '/api/user/password/reset': {
        get: { tags: ['Client - User'], summary: 'Reset password page', responses: { 200: { description: 'Reset page' } } },
        post: {
          tags: ['Client - User'],
          summary: 'Reset password (requires auth)',
          security: [{ BearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['password'], properties: { password: { type: 'string', format: 'password' } } } } } },
          responses: { 200: { description: 'Password reset' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/api/user/info': {
        get: {
          tags: ['Client - User'],
          summary: 'Get current user info',
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: 'User info', content: { 'application/json': { schema: { type: 'object', properties: { code: { type: 'number' }, data: { type: 'object', properties: { user: { '$ref': '#/components/schemas/User' } } } } } } } }, 401: { description: 'Unauthorized' } },
        },
      },
      '/api/user/edit': {
        get: {
          tags: ['Client - User'],
          summary: 'Get edit user page',
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: 'User edit data' }, 401: { description: 'Unauthorized' } },
        },
        patch: {
          tags: ['Client - User'],
          summary: 'Update user profile',
          security: [{ BearerAuth: [] }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { fullName: { type: 'string' }, email: { type: 'string' }, password: { type: 'string' }, phone: { type: 'string' }, avatar: { type: 'string' } } } } } },
          responses: { 200: { description: 'Profile updated' }, 400: { description: 'Email already exists' } },
        },
      },

      // ───────── ADMIN: Auth ─────────
      '/api/admin/auth/login': {
        get: { tags: ['Admin - Auth'], summary: 'Admin login page', responses: { 200: { description: 'Login page' } } },
        post: {
          tags: ['Admin - Auth'],
          summary: 'Admin login',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string' }, password: { type: 'string' } } } } } },
          responses: { 200: { description: 'Admin logged in' }, 401: { description: 'Invalid credentials' } },
        },
      },
      '/api/admin/auth/refresh-token': {
        post: {
          tags: ['Admin - Auth'],
          summary: 'Admin refresh token',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } } } } },
          responses: { 200: { description: 'Tokens refreshed' }, 401: { description: 'Invalid token' } },
        },
      },
      '/api/admin/auth/logout': {
        post: {
          tags: ['Admin - Auth'],
          summary: 'Admin logout',
          responses: { 200: { description: 'Logged out' } },
        },
      },

      // ───────── ADMIN: Dashboard ─────────
      '/api/admin/dashboard': {
        get: {
          tags: ['Admin - Dashboard'],
          summary: 'Get dashboard statistics',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'Dashboard stats', content: { 'application/json': { schema: { type: 'object', properties: { code: { type: 'number' }, message: { type: 'string' }, data: { type: 'object', properties: { categoryCount: { type: 'number' }, productCount: { type: 'number' }, accountCount: { type: 'number' }, userCount: { type: 'number' }, orderCount: { type: 'number' }, orderStatusCounts: { type: 'object' }, revenueByDay: { type: 'array' } } } } } } } },
            401: { description: 'Unauthorized' },
          },
        },
      },

      // ───────── ADMIN: Products ─────────
      '/api/admin/products': {
        get: {
          tags: ['Admin - Products'],
          summary: 'Get admin product list (filtered, sorted, paginated)',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'keyword', in: 'query', schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'inactive'] } },
            { name: 'sortKey', in: 'query', schema: { type: 'string', enum: ['position', 'title', 'price', 'createdAt'] } },
            { name: 'sortValue', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          ],
          responses: { 200: { description: 'Admin product list' } },
        },
      },
      '/api/admin/products/create': {
        post: {
          tags: ['Admin - Products'],
          summary: 'Create a new product',
          security: [{ BearerAuth: [] }],
          requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', required: ['title', 'price'], properties: { title: { type: 'string' }, description: { type: 'string' }, price: { type: 'number' }, discountPercentage: { type: 'number' }, stock: { type: 'number' }, status: { type: 'string' }, product_category_id: { type: 'string' }, position: { type: 'number' }, featured: { type: 'string' }, thumbnail: { type: 'string', format: 'binary' } } } } } },
          responses: { 200: { description: 'Product created' } },
        },
      },
      '/api/admin/products/edit/{id}': {
        get: { tags: ['Admin - Products'], summary: 'Get product for editing', security: [{ BearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Product data' } } },
        patch: {
          tags: ['Admin - Products'],
          summary: 'Update a product',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, price: { type: 'number' }, discountPercentage: { type: 'number' }, stock: { type: 'number' }, status: { type: 'string' }, product_category_id: { type: 'string' }, position: { type: 'number' }, featured: { type: 'string' }, thumbnail: { type: 'string', format: 'binary' } } } } } },
          responses: { 200: { description: 'Product updated' } },
        },
      },
      '/api/admin/products/detail/{id}': {
        get: {
          tags: ['Admin - Products'],
          summary: 'Get product detail',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Product detail' } },
        },
      },
      '/api/admin/products/change-status/{status}/{id}': {
        patch: {
          tags: ['Admin - Products'],
          summary: 'Change product status (active/inactive)',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'path', required: true, schema: { type: 'string', enum: ['active', 'inactive'] } },
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Status changed' } },
        },
      },
      '/api/admin/products/change-multi': {
        patch: {
          tags: ['Admin - Products'],
          summary: 'Bulk change product status or delete',
          security: [{ BearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['ids', 'type'], properties: { ids: { type: 'array', items: { type: 'string' } }, type: { type: 'string', enum: ['active', 'inactive', 'delete'] }, value: { type: 'string' } } } } } },
          responses: { 200: { description: 'Bulk action completed' } },
        },
      },
      '/api/admin/products/delete/{id}': {
        delete: {
          tags: ['Admin - Products'],
          summary: 'Soft delete a product',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Product deleted' } },
        },
      },

      // ───────── ADMIN: Categories ─────────
      '/api/admin/products-category': {
        get: {
          tags: ['Admin - Categories'],
          summary: 'Get all categories (tree structure)',
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: 'Category list' } },
        },
      },
      '/api/admin/products-category/create': {
        post: {
          tags: ['Admin - Categories'],
          summary: 'Create a new category',
          security: [{ BearerAuth: [] }],
          requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', required: ['title'], properties: { title: { type: 'string' }, parent_id: { type: 'string' }, description: { type: 'string' }, status: { type: 'string' }, position: { type: 'number' }, thumbnail: { type: 'string', format: 'binary' } } } } } },
          responses: { 200: { description: 'Category created' } },
        },
      },
      '/api/admin/products-category/edit/{id}': {
        get: { tags: ['Admin - Categories'], summary: 'Get category for editing', security: [{ BearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Category data' } } },
        patch: {
          tags: ['Admin - Categories'],
          summary: 'Update a category',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { title: { type: 'string' }, parent_id: { type: 'string' }, description: { type: 'string' }, status: { type: 'string' }, position: { type: 'number' }, thumbnail: { type: 'string', format: 'binary' } } } } } },
          responses: { 200: { description: 'Category updated' } },
        },
      },
      '/api/admin/products-category/delete/{id}': {
        delete: {
          tags: ['Admin - Categories'],
          summary: 'Delete a category',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Category deleted' } },
        },
      },
      '/api/admin/products-category/detail/{id}': {
        get: {
          tags: ['Admin - Categories'],
          summary: 'Get category detail',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Category detail' } },
        },
      },

      // ───────── ADMIN: Roles ─────────
      '/api/admin/roles': {
        get: {
          tags: ['Admin - Roles'],
          summary: 'Get all roles',
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: 'Role list', content: { 'application/json': { schema: { type: 'object', properties: { code: { type: 'number' }, data: { type: 'object', properties: { roles: { type: 'array', items: { '$ref': '#/components/schemas/Role' } } } } } } } } } },
        },
      },
      '/api/admin/roles/create': {
        post: {
          tags: ['Admin - Roles'],
          summary: 'Create a new role',
          security: [{ BearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['title'], properties: { title: { type: 'string' }, description: { type: 'string' }, permissions: { type: 'array', items: { type: 'string' } } } } } } },
          responses: { 200: { description: 'Role created' } },
        },
      },
      '/api/admin/roles/edit/{id}': {
        get: { tags: ['Admin - Roles'], summary: 'Get role for editing', security: [{ BearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Role data' } } },
        patch: {
          tags: ['Admin - Roles'],
          summary: 'Update a role',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, permissions: { type: 'array', items: { type: 'string' } } } } } } },
          responses: { 200: { description: 'Role updated' } },
        },
      },
      '/api/admin/roles/delete/{id}': {
        delete: {
          tags: ['Admin - Roles'],
          summary: 'Delete a role',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Role deleted' } },
        },
      },
      '/api/admin/roles/permissions': {
        get: {
          tags: ['Admin - Roles'],
          summary: 'Get permissions page',
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: 'Permissions data' } },
        },
        patch: {
          tags: ['Admin - Roles'],
          summary: 'Update permissions for all roles',
          security: [{ BearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['permissions'], properties: { permissions: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, permissions: { type: 'array', items: { type: 'string' } } } } } } } } } },
          responses: { 200: { description: 'Permissions updated' } },
        },
      },

      // ───────── ADMIN: Accounts ─────────
      '/api/admin/accounts': {
        get: {
          tags: ['Admin - Accounts'],
          summary: 'Get all admin accounts',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'keyword', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Account list' } },
        },
      },
      '/api/admin/accounts/create': {
        post: {
          tags: ['Admin - Accounts'],
          summary: 'Create a new admin account',
          security: [{ BearerAuth: [] }],
          requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', required: ['fullName', 'email', 'password'], properties: { fullName: { type: 'string' }, email: { type: 'string' }, password: { type: 'string' }, phone: { type: 'string' }, role_id: { type: 'string' }, status: { type: 'string' }, avatar: { type: 'string', format: 'binary' } } } } } },
          responses: { 200: { description: 'Account created' } },
        },
      },
      '/api/admin/accounts/edit/{id}': {
        get: { tags: ['Admin - Accounts'], summary: 'Get account for editing', security: [{ BearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Account data' } } },
        patch: {
          tags: ['Admin - Accounts'],
          summary: 'Update an admin account',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { fullName: { type: 'string' }, email: { type: 'string' }, password: { type: 'string' }, phone: { type: 'string' }, role_id: { type: 'string' }, status: { type: 'string' }, avatar: { type: 'string', format: 'binary' } } } } } },
          responses: { 200: { description: 'Account updated' } },
        },
      },
      '/api/admin/accounts/delete/{id}': {
        delete: {
          tags: ['Admin - Accounts'],
          summary: 'Delete an admin account',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Account deleted' } },
        },
      },
      '/api/admin/accounts/change-status/{status}/{id}': {
        patch: {
          tags: ['Admin - Accounts'],
          summary: 'Change account status',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'path', required: true, schema: { type: 'string', enum: ['active', 'inactive'] } },
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Status changed' } },
        },
      },

      // ───────── ADMIN: My Account ─────────
      '/api/admin/my-account': {
        get: {
          tags: ['Admin - My Account'],
          summary: 'Get current admin profile',
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: 'Admin profile' } },
        },
      },
      '/api/admin/my-account/edit': {
        get: {
          tags: ['Admin - My Account'],
          summary: 'Get edit profile page',
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: 'Edit profile data' } },
        },
        patch: {
          tags: ['Admin - My Account'],
          summary: 'Update admin profile',
          security: [{ BearerAuth: [] }],
          requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { fullName: { type: 'string' }, email: { type: 'string' }, password: { type: 'string' }, phone: { type: 'string' }, avatar: { type: 'string', format: 'binary' } } } } } },
          responses: { 200: { description: 'Profile updated' } },
        },
      },

      // ───────── ADMIN: Settings ─────────
      '/api/admin/settings/general': {
        get: {
          tags: ['Admin - Settings'],
          summary: 'Get general settings',
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: 'Settings data' } },
        },
        patch: {
          tags: ['Admin - Settings'],
          summary: 'Update general settings',
          security: [{ BearerAuth: [] }],
          requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { siteName: { type: 'string' }, phone: { type: 'string' }, email: { type: 'string' }, address: { type: 'string' }, copyright: { type: 'string' }, logo: { type: 'string', format: 'binary' } } } } } },
          responses: { 200: { description: 'Settings updated' } },
        },
      },
    },
  },
  apis: [],
}

module.exports = swaggerJsdoc(options)
