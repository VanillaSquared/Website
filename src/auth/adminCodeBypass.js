const ADMIN_CODE_TTL_MS = 10 * 60 * 1000;
const codes = new Map();

export function isAdminCodeBypassEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.ADMIN_CODE_BYPASS === "1";
}

export function saveAdminEmailCode(email, code) {
  if (!isAdminCodeBypassEnabled() || !email || !code) {
    return;
  }

  codes.set(email, {
    code: String(code),
    expiresAt: Date.now() + ADMIN_CODE_TTL_MS,
  });
}

export function getAdminEmailCode(email) {
  if (!isAdminCodeBypassEnabled() || !email) {
    return "";
  }

  const entry = codes.get(email);

  if (!entry) {
    return "";
  }

  if (entry.expiresAt <= Date.now()) {
    codes.delete(email);
    return "";
  }

  return entry.code;
}
