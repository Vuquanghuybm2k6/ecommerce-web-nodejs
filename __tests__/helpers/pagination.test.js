const paginationHelper = require('../../helpers/pagination')

describe('paginationHelper', () => {
  test('returns default page 1 when no page in query', () => {
    const result = paginationHelper({}, 50, { currentPage: 1, limitItem: 10 })
    expect(result.currentPage).toBe(1)
    expect(result.skip).toBe(0)
    expect(result.totalPage).toBe(5)
  })

  test('calculates skip correctly for page 3', () => {
    const result = paginationHelper({ page: '3' }, 50, { currentPage: 1, limitItem: 10 })
    expect(result.skip).toBe(20)
    expect(result.currentPage).toBe(3)
  })

  test('returns 1 totalPage when totalProduct <= limitItem', () => {
    const result = paginationHelper({}, 5, { currentPage: 1, limitItem: 10 })
    expect(result.totalPage).toBe(1)
  })

  test('handles page 0 gracefully', () => {
    const result = paginationHelper({ page: '0' }, 50, { currentPage: 1, limitItem: 10 })
    expect(result.skip).toBe(-10)
  })
})
