"use server";

import { redirect } from "next/navigation";

import { clearTokens, getAuthSubject } from "./auth";

export async function auth() {
  return getAuthSubject();
}

export async function login() {
  redirect("/login");
}

export async function logout() {
  await clearTokens();
  redirect("/");
}
