const mongoose = require('mongoose')
require('dotenv').config()

const Role = require('./models/role.model')
const Account = require('./models/account.model')

const seedRoles = [
  {
    title: 'Super Admin',
    description: 'Toàn quyền hệ thống',
    permissions: [
      'dashboard_view',
      'products_view', 'products_create', 'products_edit', 'products_delete',
      'category_view', 'category_create', 'category_edit', 'category_delete',
      'orders_view', 'orders_edit', 'orders_delete',
      'reviews_view', 'reviews_delete',
      'roles_view', 'roles_create', 'roles_edit', 'roles_delete', 'roles_permissions',
      'accounts_view', 'accounts_create', 'accounts_edit', 'accounts_delete',
      'settings_view', 'settings_edit',
    ],
  },
  {
    title: 'Product Manager',
    description: 'Quản lý sản phẩm và danh mục',
    permissions: [
      'dashboard_view',
      'products_view', 'products_create', 'products_edit', 'products_delete',
      'category_view', 'category_create', 'category_edit', 'category_delete',
    ],
  },
  {
    title: 'Order Manager',
    description: 'Quản lý đơn hàng và đánh giá',
    permissions: [
      'dashboard_view',
      'orders_view', 'orders_edit',
      'reviews_view', 'reviews_delete',
    ],
  },
]

mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    console.log('Connected to MongoDB')

    for (const roleData of seedRoles) {
      const existing = await Role.findOne({ title: roleData.title })
      if (existing) {
        await Role.updateOne({ _id: existing._id }, roleData)
        console.log(`Updated role: ${roleData.title}`)
      } else {
        await Role.create(roleData)
        console.log(`Created role: ${roleData.title}`)
      }
    }

    console.log('Seed complete')
    process.exit(0)
  })
  .catch(err => {
    console.error('Seed failed:', err)
    process.exit(1)
  })