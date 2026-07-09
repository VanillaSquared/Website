import "server-only";

import { NextResponse } from "next/server";

import { getAuthSubject } from "@/app/auth";
import { getUserById } from "@/auth/openSQL";
import { hasPermission } from "@/auth/permissions";

export function isProtectedUser(user) {
  return false;
}

export function jsonError(message, status) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function requireApiPermission(permission) {
  const subject = await getAuthSubject({ updateTokens: false });
  const user = subject ? subject.properties : null;

  if (!user) return { error: jsonError("Unauthorized", 401) };
  if (!await hasPermission(user, permission)) return { error: jsonError("Forbidden", 403) };

  return { user };
}

export async function getMutableTargetUser(userId) {
  const user = await getUserById(userId);
  if (!user) return { error: jsonError("Not found", 404) };
  if (isProtectedUser(user)) return { error: jsonError("This account is protected.", 403) };
  return { user };
}

export function normalizeRoleName(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizePermissionList(value, isValidPermission) {
  return Array.isArray(value) ? [...new Set(value)].filter(isValidPermission).sort() : [];
}
