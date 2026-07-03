"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  normalizeEmail,
  normalizeUsername,
  validateEmail,
  validateUsername,
} from "@/auth/openAuth";
import { PENDING_LOGIN_EMAIL_COOKIE } from "@/auth/issuer";
import {
  createUser,
  getUserByEmail,
  getUserByUsername,
  getUserByUsernameAndEmail,
} from "@/auth/openSQL";
import { getAuthClient, getOrigin } from "@/app/auth";

function redirectWithError(path, message) {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
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

  return { username, email };
}

function validateCredentials(path, { username, email }) {
  if (!validateUsername(username)) {
    redirectWithError(path, "Username must be 3-32 characters and only use letters, numbers, or underscores.");
  }

  if (!validateEmail(email)) {
    redirectWithError(path, "Enter a valid email address.");
  }
}

async function startEmailCodeLogin(email) {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";

  cookieStore.set({
    name: PENDING_LOGIN_EMAIL_COOKIE,
    value: email,
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 10 * 60,
  });

  const origin = await getOrigin();
  const client = getAuthClient(origin);
  const redirectUri = `${origin}/api/callback`;
  const { url } = await client.authorize(redirectUri, "code", {
    provider: "code",
  });

  redirect(url);
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

  await startEmailCodeLogin(user.email);
}

export async function signupWithEmailCode(formData) {
  const credentials = getCredentials(formData);
  validateCredentials("/signup", credentials);

  let user;

  try {
    if (await getUserByUsername(credentials.username)) {
      redirectWithError("/signup", "That username is already taken.");
    }

    if (await getUserByEmail(credentials.email)) {
      redirectWithError("/signup", "That email is already in use.");
    }

    user = await createUser({
      id: crypto.randomUUID(),
      username: credentials.username,
      email: credentials.email,
    });
  } catch (error) {
    redirectDatabaseError("/signup", error);
  }

  await startEmailCodeLogin(user.email);
}
