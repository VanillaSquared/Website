"use server";

import { redirect } from "next/navigation";

import { subjects } from "@/auth/subjects";
import { clearTokens, getAuthClient, getOrigin, getTokenCookies, setTokens } from "./auth";

export async function auth() {
  const origin = await getOrigin();
  const client = getAuthClient(origin);
  const { accessToken, refreshToken } = await getTokenCookies();

  if (!accessToken) {
    return false;
  }

  const verified = await client.verify(subjects, accessToken, {
    refresh: refreshToken,
  });

  if (verified.err) {
    return false;
  }

  if (verified.tokens) {
    await setTokens(verified.tokens.access, verified.tokens.refresh);
  }

  return verified.subject;
}

export async function login() {
  redirect("/login");
}

export async function logout() {
  await clearTokens();
  redirect("/");
}
