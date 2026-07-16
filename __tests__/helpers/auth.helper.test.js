const authHelper = require('../../helpers/auth.helper')

// hàm của jest: describe(tên, callback) dùng để nhóm các test case lại với nhau, tham số thứ nhất chỉ hiển thị lên terminal
describe('authHelper', () => {
  describe('getAccessTokenFromHeader', () => {// lồng describe để nhóm các test case liên quan đến 1 hàm lại với nhau
    test('returns null when no authorization header', () => {
      expect(authHelper.getAccessTokenFromHeader({ headers: {} })).toBeNull()
    })

    test('returns null for malformed header without Bearer', () => {
      const req = { headers: { authorization: 'InvalidFormat' } }
      expect(authHelper.getAccessTokenFromHeader(req)).toBeNull()
    })

    test('returns empty string for Bearer without token', () => {
      const req = { headers: { authorization: 'Bearer ' } }
      expect(authHelper.getAccessTokenFromHeader(req)).toBe('')
    })

    test('extracts Bearer token correctly', () => {
      const req = { headers: { authorization: 'Bearer my-token-123' } }
      expect(authHelper.getAccessTokenFromHeader(req)).toBe('my-token-123')
    })
  })
})
