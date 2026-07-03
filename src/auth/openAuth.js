import { createHmac, timingSafeEqual } from "crypto";

export function normalizeUsername(username) {
  return String(username ?? "").trim().toLowerCase();
}

export function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

export function validateUsername(username) {
  return /^[a-z0-9_]{3,32}$/.test(username);
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getEmailCodeSecret() {
  if (process.env.EMAIL_CODE_CLAIM_SECRET) {
    return process.env.EMAIL_CODE_CLAIM_SECRET;
  }

  if (process.env.OPENAUTH_APP_CLIENT_SECRET) {
    return process.env.OPENAUTH_APP_CLIENT_SECRET;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("EMAIL_CODE_CLAIM_SECRET is required in production.");
  }

  return "development-email-code-claim-secret";
}

export function signEmailCodeClaim(email, username = "") {
  return createHmac("sha256", getEmailCodeSecret())
    .update(JSON.stringify({ email: normalizeEmail(email), username: normalizeUsername(username) }))
    .digest("base64url");
}

export function verifyEmailCodeClaim(email, signature, username = "") {
  if (!signature) {
    return false;
  }

  const expected = Buffer.from(signEmailCodeClaim(email, username));
  const received = Buffer.from(String(signature));

  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function subjectFromUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
  };
}
