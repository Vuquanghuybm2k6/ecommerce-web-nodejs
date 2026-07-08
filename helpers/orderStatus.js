const VALID_TRANSITIONS = {
  pending:    ["confirmed", "cancelled"],
  pending_vnpay: ["pending", "payment_failed", "cancelled"],
  payment_failed: ["pending_vnpay", "cancelled"],
  confirmed:  ["shipped", "cancelled"],
  shipped:    ["delivered"],
  delivered:  [],
  cancelled:  [],
}

function isValidTransition(fromStatus, toStatus) {
  if (!VALID_TRANSITIONS[fromStatus]) return false
  return VALID_TRANSITIONS[fromStatus].includes(toStatus)
}

module.exports = { VALID_TRANSITIONS, isValidTransition }
