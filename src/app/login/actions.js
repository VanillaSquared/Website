"use server";

import { createHash, createHmac, randomInt, timingSafeEqual } from "crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  normalizeEmail,
  normalizeUsername,
  validateEmail,
  validateUsername,
} from "@/auth/openAuth";
import { isAdminCodeBypassEnabled, saveAdminEmailCode } from "@/auth/adminCodeBypass";
import { createInternalAuthHeader, getInternalAuthSecret, INTERNAL_AUTH_HEADER } from "@/auth/internalAuthGuard";
import { authIssuer } from "@/auth/issuer";
import {
  getUserByEmail,
  getUserByUsername,
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

function getSignupCredentials(formData) {
  const username = normalizeUsername(formData.get("username"));
  const email = normalizeEmail(formData.get("email"));
  const returnTo = sanitizeReturnTo(formData.get("returnTo"));

  return { username, email, returnTo };
}

function getLoginCredentials(formData) {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const returnTo = sanitizeReturnTo(formData.get("returnTo"));
  const email = normalizeEmail(identifier);
  const username = normalizeUsername(identifier);

  return { identifier, email, username, returnTo };
}

function validateCredentials(path, { username, email }) {
  if (!validateUsername(username)) {
    redirectWithError(path, `Username must be ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters and only use letters, numbers, or underscores.`);
  }

  if (!validateEmail(email)) {
    redirectWithError(path, "Enter a valid email address.");
  }
}

const EMAIL_CODE_COOKIE = "pending_email_code";
const EMAIL_CODE_MAX_AGE = 10 * 60;

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

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
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

async function validatePendingEmailLogin(pending) {
  const email = normalizeEmail(pending?.email);
  const username = normalizeUsername(pending?.username);

  if (!validateEmail(email) || (username && !validateUsername(username))) {
    redirectWithError("/login", "Your login session is invalid. Please try again.");
  }

  if (username) {
    if (await getUserByUsername(username) || await getUserByEmail(email)) {
      redirectWithError("/signup", "That username or email is already in use.");
    }
  } else if (!await getUserByEmail(email)) {
    redirectWithError("/login", "No account exists for this email address.");
  }

  return { ...pending, email, username };
}

async function completeEmailLogin(pending) {
  const validatedPending = await validatePendingEmailLogin(pending);
  const origin = await getOrigin();
  const tokenResponse = await authIssuer.fetch(new Request(`${origin}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      [INTERNAL_AUTH_HEADER]: createInternalAuthHeader("internal_email"),
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      provider: "internal_email",
      client_id: "vanillasquaredwebsite",
      client_secret: getInternalAuthSecret(),
      email: validatedPending.email,
      username: validatedPending.username,
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
  const credentials = getLoginCredentials(formData);

  if (!credentials.identifier) {
    redirectWithError("/login", "Enter your username or email address.");
  }

  if (!validateEmail(credentials.email) && !validateUsername(credentials.username)) {
    redirectWithError("/login", `Enter a valid email address or username with ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} letters, numbers, or underscores.`);
  }

  let user;

  try {
    user = validateEmail(credentials.email)
      ? await getUserByEmail(credentials.email)
      : await getUserByUsername(credentials.username);
  } catch (error) {
    redirectDatabaseError("/login", error);
  }

  if (!user) {
    redirectWithError("/login", "No account exists for that username or email address.");
  }

  await startEmailCodeLogin(user.email, "", credentials.returnTo);
}

export async function signupWithEmailCode(formData) {
  const credentials = getSignupCredentials(formData);
  validateCredentials("/signup", credentials);

  try {
    if (credentials.username === "painterflow11" && process.env.OWNER_EMAIL && credentials.email !== normalizeEmail(process.env.OWNER_EMAIL)) {
      redirectWithError("/signup", "That username is reserved.");
    }

    if (credentials.username === "painterflow11" && !process.env.OWNER_EMAIL) {
      redirectWithError("/signup", "That username is reserved until OWNER_EMAIL is configured.");
    }

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
