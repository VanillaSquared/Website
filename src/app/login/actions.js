"use server";

import { createHash, createHmac, randomInt, timingSafeEqual } from "crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  normalizeEmail,
  normalizeUsername,
  validateEmail,
  validateUsername,
} from "@/auth/openAuth";
import { isAdminCodeBypassEnabled, saveAdminEmailCode } from "@/auth/adminCodeBypass";
import { authIssuer } from "@/auth/issuer";
import {
  getUserByEmail,
  getUserByUsername,
  getUserByUsernameAndEmail,
} from "@/auth/openSQL";
import { getOrigin, sanitizeReturnTo, setTokens } from "@/app/auth";

function redirectWithError(path, message) {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}error=${encodeURIComponent(message)}`);
}

function isDatabaseConnectionError(error) {
  return error?.code === "ECONNREFUSED" || error?.errors?.some?.((item) => item?.code === "ECONNREFUSED");
}

function redirectDatabaseError(path, error) {
  if (isDatabaseConnectionError(error)) {
    redirectWithError(path, "The account database is unavailable. Start MySQL or check your database environment variables.");
  }

  throw error;
}

function getCredentials(formData) {
  const username = normalizeUsername(formData.get("username"));
  const email = normalizeEmail(formData.get("email"));
  const returnTo = sanitizeReturnTo(formData.get("returnTo"));

  return { username, email, returnTo };
}

function validateCredentials(path, { username, email }) {
  if (!validateUsername(username)) {
    redirectWithError(path, "Username must be 3-32 characters and only use letters, numbers, or underscores.");
  }

  if (!validateEmail(email)) {
    redirectWithError(path, "Enter a valid email address.");
  }
}

const EMAIL_CODE_COOKIE = "pending_email_code";
const EMAIL_CODE_MAX_AGE = 10 * 60;

function getInternalAuthSecret() {
  const secret = process.env.INTERNAL_AUTH_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("INTERNAL_AUTH_SECRET is required for email code login.");
  }

  return secret ?? "dev-internal-auth-secret";
}

function hashCode(code) {
  return createHash("sha256").update(code).digest("hex");
}

function signPayload(payload) {
  return createHmac("sha256", getInternalAuthSecret()).update(payload).digest("hex");
}

function encodePendingEmailCode(value) {
  const payload = Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

function decodePendingEmailCode(value) {
  const [payload, signature] = String(value ?? "").split(".");

  if (!payload || !signature || signPayload(payload) !== signature) {
    return null;
  }

  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}

function safeCompare(value, expected) {
  const valueBuffer = Buffer.from(String(value));
  const expectedBuffer = Buffer.from(String(expected));

  return valueBuffer.length === expectedBuffer.length && timingSafeEqual(valueBuffer, expectedBuffer);
}

function isAdminCode(code) {
  return isAdminCodeBypassEnabled() && String(code).trim().toLowerCase() === "admin";
}

async function savePendingEmailCode({ email, username = "", returnTo = "/" }) {
  const code = String(randomInt(100000, 1000000));
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";

  cookieStore.set({
    name: EMAIL_CODE_COOKIE,
    value: encodePendingEmailCode({
      email,
      username,
      returnTo: sanitizeReturnTo(returnTo),
      codeHash: hashCode(code),
      expiresAt: Date.now() + EMAIL_CODE_MAX_AGE * 1000,
    }),
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: EMAIL_CODE_MAX_AGE,
  });

  saveAdminEmailCode(email, code);

  // TODO: Wire this to a transactional email provider before production use.
  console.log(`[OpenAuth] Login code for ${email}: ${code}`);
}

async function startEmailCodeLogin(email, username = "", returnTo = "/") {
  await savePendingEmailCode({ email, username, returnTo });
  redirect(`/login/code?email=${encodeURIComponent(email)}`);
}

async function completeEmailLogin(pending) {
  const origin = await getOrigin();
  const tokenResponse = await authIssuer.fetch(new Request(`${origin}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      provider: "internal_email",
      client_id: "vanillasquaredwebsite",
      client_secret: getInternalAuthSecret(),
      email: pending.email,
      username: pending.username,
    }),
  }));

  if (!tokenResponse.ok) {
    redirectWithError("/login", "Could not complete login. Please try again.");
  }

  const tokens = await tokenResponse.json();
  await setTokens(tokens.access_token, tokens.refresh_token);
}

export async function verifyEmailCode(formData) {
  const cookieStore = await cookies();
  const pending = decodePendingEmailCode(cookieStore.get(EMAIL_CODE_COOKIE)?.value);
  const code = String(formData.get("code") ?? "").trim();

  if (!pending || pending.expiresAt < Date.now()) {
    cookieStore.delete(EMAIL_CODE_COOKIE);
    redirectWithError("/login", "Your login session expired. Please try again.");
  }

  if (!isAdminCode(code) && !safeCompare(hashCode(code), pending.codeHash)) {
    redirectWithError(`/login/code?email=${encodeURIComponent(pending.email)}`, "The code is incorrect. In development, type admin to skip the code.");
  }

  await completeEmailLogin(pending);
  cookieStore.delete(EMAIL_CODE_COOKIE);

  redirect(sanitizeReturnTo(pending.returnTo));
}

export async function resendEmailCode() {
  const cookieStore = await cookies();
  const pending = decodePendingEmailCode(cookieStore.get(EMAIL_CODE_COOKIE)?.value);

  if (!pending || pending.expiresAt < Date.now()) {
    cookieStore.delete(EMAIL_CODE_COOKIE);
    redirectWithError("/login", "Your login session expired. Please try again.");
  }

  await savePendingEmailCode(pending);
  redirect(`/login/code?email=${encodeURIComponent(pending.email)}&message=${encodeURIComponent("A new code was sent.")}`);
}

export async function loginWithEmailCode(formData) {
  const credentials = getCredentials(formData);
  validateCredentials("/login", credentials);

  let user;

  try {
    user = await getUserByUsernameAndEmail(credentials.username, credentials.email);
  } catch (error) {
    redirectDatabaseError("/login", error);
  }

  if (!user) {
    redirectWithError("/login", "Username and email do not match an account.");
  }

  await startEmailCodeLogin(user.email, "", credentials.returnTo);
}

export async function signupWithEmailCode(formData) {
  const credentials = getCredentials(formData);
  validateCredentials("/signup", credentials);

  try {
    if (await getUserByUsername(credentials.username)) {
      redirectWithError("/signup", "That username is already taken.");
    }

    if (await getUserByEmail(credentials.email)) {
      redirectWithError("/signup", "That email is already in use.");
    }
  } catch (error) {
    redirectDatabaseError("/signup", error);
  }

  await startEmailCodeLogin(credentials.email, credentials.username, credentials.returnTo);
}
