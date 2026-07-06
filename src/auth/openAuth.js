import { createHmac, timingSafeEqual } from "crypto";

export function normalizeUsername(username) {
  return String(username ?? "").trim().toLowerCase();
}

export function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 32;
export const USERNAME_PATTERN = /^[a-z0-9_]+$/;

export function validateUsername(username) {
  const normalizedUsername = normalizeUsername(username);

  return normalizedUsername.length >= USERNAME_MIN_LENGTH
    && normalizedUsername.length <= USERNAME_MAX_LENGTH
    && USERNAME_PATTERN.test(normalizedUsername);
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
