const assert = require('assert')
const RefreshToken = require('../models/refresh-token.model')
const authHelper = require('../helpers/auth.helper')

;(async () => {
  let saveCalls = 0
  RefreshToken.updateMany = async () => {}
  RefreshToken.prototype.save = async function () {
    saveCalls += 1
  }

  const user = { _id: 'user-1', email: 'test@example.com' }
  const req = { get: () => 'test-agent', ip: '127.0.0.1' }

  const tokens = await authHelper.createTokenPair(user, req)

  assert.ok(tokens.accessToken, 'access token should be created')
  assert.ok(tokens.refreshToken, 'refresh token should be created')
  assert.strictEqual(saveCalls, 1, 'refresh token should be persisted once')

  const res = { cookies: {}, cookie(name, value, options) { this.cookies[name] = { value, options } } }
  authHelper.setAuthCookies(res, tokens)
  assert.strictEqual(res.cookies.accessToken.options.maxAge, 15 * 60 * 1000, 'access token cookie should last 15 minutes')

  console.log('client auth helper ok')
})().catch((error) => {
  console.error(error)
  process.exit(1)
})
