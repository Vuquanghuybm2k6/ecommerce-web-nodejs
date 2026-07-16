const jwtHelper = require('../../helpers/jwt.helper')

describe('jwtHelper', () => {
  const payload = { id: '123', email: 'test@test.com' }

  test('signs and verifies access token', () => {
    const token = jwtHelper.signAccessToken(payload)
    const decoded = jwtHelper.verifyAccessToken(token)
    expect(decoded.id).toBe('123')
    expect(decoded.email).toBe('test@test.com')
  })

  test('signs and verifies refresh token', () => {
    const token = jwtHelper.signRefreshToken(payload)
    const decoded = jwtHelper.verifyRefreshToken(token)
    expect(decoded.id).toBe('123')
  })

  test('throws on invalid access token', () => {
    expect(() => jwtHelper.verifyAccessToken('invalid-token')).toThrow()
  })

  test('throws on invalid refresh token', () => {
    expect(() => jwtHelper.verifyRefreshToken('invalid-token')).toThrow()
  })

  test('generateSessionId returns correct length', () => {
    const sessionId = jwtHelper.generateSessionId()
    expect(sessionId).toHaveLength(20)
  })
})
