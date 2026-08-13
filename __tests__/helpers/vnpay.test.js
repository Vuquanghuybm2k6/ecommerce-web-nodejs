const crypto = require("crypto")
const qs = require("qs")

jest.resetModules()
process.env.VNP_TMN_CODE = "TEST_TMN_CODE"
process.env.VNP_HASH_SECRET = "TEST_HASH_SECRET"
process.env.VNP_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
process.env.VNP_RETURN_URL = "http://localhost:3000/api/checkout/vnpay-return"

const vnpay = require("../../helpers/vnpay")

function queryObject(url) {
  return Object.fromEntries(new URL(url).searchParams)
}

function recomputeHash(query, secret = "TEST_HASH_SECRET") {
  const params = { ...query }
  delete params.vnp_SecureHash
  delete params.vnp_SecureHashType
  const sorted = vnpay.sortObject(params)
  const signData = qs.stringify(sorted, { encode: false })
  return crypto.createHmac("sha512", secret)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex")
}

describe("vnpay helper", () => {
  describe("buildPaymentUrl", () => {
    const url = vnpay.buildPaymentUrl({
      amount: 150000,
      orderCode: "DH12345678",
      ipAddr: "1.2.3.4",
    })

    const query = queryObject(url)

    test("returns a URL under the configured vnp_Url", () => {
      expect(url.startsWith(process.env.VNP_URL + "?")).toBe(true)
    })

    test("includes required gateway parameters", () => {
      expect(query.vnp_Version).toBe("2.1.0")
      expect(query.vnp_Command).toBe("pay")
      expect(query.vnp_TmnCode).toBe("TEST_TMN_CODE")
      expect(query.vnp_CurrCode).toBe("VND")
      expect(query.vnp_Locale).toBe("vn")
      expect(query.vnp_OrderType).toBe("other")
      expect(query.vnp_TxnRef).toBe("DH12345678")
      expect(query.vnp_IpAddr).toBe("1.2.3.4")
    })

    test("multiplies amount by 100 (VND has no decimal)", () => {
      expect(query.vnp_Amount).toBe("15000000")
    })

    test("uses the provided returnUrl when passed", () => {
      const custom = vnpay.buildPaymentUrl({
        amount: 10000,
        orderCode: "DH1",
        returnUrl: "http://localhost:3000/api/checkout/vnpay-return",
        ipAddr: "1.2.3.4",
      })
      expect(queryObject(custom).vnp_ReturnUrl).toBe("http://localhost:3000/api/checkout/vnpay-return")
    })

    test("adds vnp_BankCode only when bankCode is provided", () => {
      const withBank = queryObject(vnpay.buildPaymentUrl({
        amount: 10000,
        orderCode: "DH1",
        bankCode: "NCB",
        ipAddr: "1.2.3.4",
      }))
      expect(withBank.vnp_BankCode).toBe("NCB")
      expect(query.vnp_BankCode).toBeUndefined()
    })

    test("adds vnp_ExpireDate in YYYYMMDDHHmmss format, ~15 minutes in the future", () => {
      expect(query.vnp_ExpireDate).toMatch(/^\d{14}$/)

      const expire = new Date(
        query.vnp_ExpireDate.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1-$2-$3T$4:$5:$6")
      )
      const diffMs = expire.getTime() - Date.now()
      expect(diffMs).toBeGreaterThan(14 * 60 * 1000 - 5000)
      expect(diffMs).toBeLessThan(16 * 60 * 1000)
    })

    test("signs with an HMAC-SHA512 over the sorted params", () => {
      expect(query.vnp_SecureHash).toBeTruthy()
      expect(query.vnp_SecureHash).toBe(recomputeHash(query))
    })
  })

  describe("verifyParams", () => {
    const url = vnpay.buildPaymentUrl({
      amount: 250000,
      orderCode: "DH999",
      ipAddr: "127.0.0.1",
    })

    test("returns true for parameters produced by buildPaymentUrl", () => {
      expect(vnpay.verifyParams(queryObject(url))).toBe(true)
    })

    test("returns false when amount is tampered", () => {
      const tampered = { ...queryObject(url), vnp_Amount: "99999999" }
      expect(vnpay.verifyParams(tampered)).toBe(false)
    })

    test("returns false when secureHash is missing", () => {
      const { vnp_SecureHash, ...noHash } = queryObject(url)
      expect(vnpay.verifyParams(noHash)).toBe(false)
    })

    test("returns false when secureHash mismatches", () => {
      const bad = { ...queryObject(url), vnp_SecureHash: "deadbeef" }
      expect(vnpay.verifyParams(bad)).toBe(false)
    })
  })

  describe("getClientIp", () => {
    test("uses the first forwarded address when x-forwarded-for is present", () => {
      const req = { headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" } }
      expect(vnpay.getClientIp(req)).toBe("203.0.113.5")
    })

    test("falls back to socket remoteAddress", () => {
      const req = { headers: {}, socket: { remoteAddress: "192.168.1.10" } }
      expect(vnpay.getClientIp(req)).toBe("192.168.1.10")
    })

    test("returns empty string when nothing is available", () => {
      expect(vnpay.getClientIp({ headers: {} })).toBe("")
    })
  })
})