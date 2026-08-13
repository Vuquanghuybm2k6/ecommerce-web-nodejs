const { applyOrderToCart } = require('../../helpers/cart')

const cartWith = (products) => ({ products })

describe('applyOrderToCart', () => {
  test('deducts exact quantities of matching products', () => {
    const cart = cartWith([
      { product_id: 'p1', variantSku: 'v1', quantity: 5 },
      { product_id: 'p2', variantSku: '', quantity: 2 },
    ])

    applyOrderToCart(cart, [{ product_id: 'p1', variantSku: 'v1', quantity: 2 }])

    expect(cart.products).toEqual([
      { product_id: 'p1', variantSku: 'v1', quantity: 3 },
      { product_id: 'p2', variantSku: '', quantity: 2 },
    ])
  })

  test('removes item when quantity reaches zero', () => {
    const cart = cartWith([{ product_id: 'p1', variantSku: 'v1', quantity: 2 }])

    applyOrderToCart(cart, [{ product_id: 'p1', variantSku: 'v1', quantity: 2 }])

    expect(cart.products).toEqual([])
  })

  test('does not touch item with a different variantSku', () => {
    const cart = cartWith([{ product_id: 'p1', variantSku: 'v1', quantity: 2 }])

    applyOrderToCart(cart, [{ product_id: 'p1', variantSku: 'v2', quantity: 1 }])

    expect(cart.products).toEqual([{ product_id: 'p1', variantSku: 'v1', quantity: 2 }])
  })

  test('ignores products that are not in the cart', () => {
    const cart = cartWith([{ product_id: 'p1', variantSku: '', quantity: 3 }])

    applyOrderToCart(cart, [{ product_id: 'zzz', variantSku: '', quantity: 1 }])

    expect(cart.products).toEqual([{ product_id: 'p1', variantSku: '', quantity: 3 }])
  })

  test('does not leave a negative quantity when order qty exceeds cart qty', () => {
    const cart = cartWith([{ product_id: 'p1', variantSku: '', quantity: 1 }])

    applyOrderToCart(cart, [{ product_id: 'p1', variantSku: '', quantity: 5 }])

    expect(cart.products).toEqual([])
  })

  test('handles cart without a products array', () => {
    const cart = {}
    expect(applyOrderToCart(cart, [{ product_id: 'p1', variantSku: '', quantity: 1 }])).toEqual({})
  })
})