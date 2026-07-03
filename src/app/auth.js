import { createClient } from "@openauthjs/openauth/client";
import { cookies as getCookies, headers as getHeaders } from "next/headers";

import { subjects } from "@/auth/subjects";

const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";
export const AUTH_RETURN_TO_COOKIE = "auth_return_to";
const TOKEN_MAX_AGE = 60 * 60 * 24 * 400;

export async function getOrigin() {
  const headers = await getHeaders();
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  const protocol = headers.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");

  return `${protocol}://${host}`;
}

export function getAuthClient(origin) {
  return createClient({
    clientID: "vanillasquaredwebsite",
    issuer: process.env.OPENAUTH_ISSUER ?? origin,
  });
}

export function sanitizeReturnTo(value) {
  const returnTo = String(value ?? "").trim();

  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return "/";
  }

  if (returnTo.startsWith("/login") || returnTo.startsWith("/signup") || returnTo.startsWith("/api/callback")) {
    return "/";
  }

  return returnTo;
}

export async function setTokens(access, refresh) {
  const cookies = await getCookies();
  const secure = process.env.NODE_ENV === "production";

  cookies.set({
    name: ACCESS_TOKEN_COOKIE,
    value: access,
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  });

  cookies.set({
    name: REFRESH_TOKEN_COOKIE,
    value: refresh,
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  });
}

export async function clearTokens() {
  const cookies = await getCookies();

  cookies.delete(ACCESS_TOKEN_COOKIE);
  cookies.delete(REFRESH_TOKEN_COOKIE);
}

export async function getTokenCookies() {
  const cookies = await getCookies();

  return {
    accessToken: cookies.get(ACCESS_TOKEN_COOKIE)?.value,
    refreshToken: cookies.get(REFRESH_TOKEN_COOKIE)?.value,
  };
}

export async function getAuthSubject({ updateTokens = true } = {}) {
  const origin = await getOrigin();
  const client = getAuthClient(origin);
  const { accessToken, refreshToken } = await getTokenCookies();

  if (!accessToken) {
    return false;
  }

  const verified = await client.verify(subjects, accessToken, refreshToken ? {
    refresh: refreshToken,
  } : undefined);

  if (verified.err) {
    return false;
  }

  if (verified.tokens && updateTokens) {
    await setTokens(verified.tokens.access, verified.tokens.refresh);
  }

  return verified.subject;
}
