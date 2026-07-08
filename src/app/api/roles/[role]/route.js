import { NextResponse } from "next/server";

import { deleteRole, getRole, getRolePermissions, renameRole } from "@/auth/openSQL";
import { DEFAULT_ROLE, PERMISSIONS, isValidRoleName } from "@/auth/permissions";
import { jsonError, normalizeRoleName, requireApiPermission } from "@/auth/userManagement";
import { guardSameOriginRequest } from "@/security/requestGuards";

const PROTECTED_ROLES = new Set([DEFAULT_ROLE, "support", "developer", "owner"]);

export async function PATCH(request, { params }) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;

  const auth = await requireApiPermission(PERMISSIONS.MANAGE_ROLES);
  if (auth.error) return auth.error;

  const { role } = await params;
  if (!isValidRoleName(role) || !await getRole(role)) return jsonError("Role not found.", 404);
  if (PROTECTED_ROLES.has(role)) return jsonError("Built-in roles cannot be renamed.", 403);

  const body = await request.json().catch(() => ({}));
  const name = normalizeRoleName(body.name);
  if (!isValidRoleName(name)) return jsonError("Invalid role name.", 400);
  if (name !== role && await getRole(name)) return jsonError("Role already exists.", 409);

  const updatedRole = name === role ? await getRole(role) : await renameRole(role, name);
  return NextResponse.json({ role: { ...updatedRole, permissions: await getRolePermissions(name) } }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request, { params }) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;

  const auth = await requireApiPermission(PERMISSIONS.MANAGE_ROLES);
  if (auth.error) return auth.error;

  const { role } = await params;
  if (!isValidRoleName(role) || !await getRole(role)) return jsonError("Role not found.", 404);
  if (PROTECTED_ROLES.has(role)) return jsonError("Built-in roles cannot be deleted.", 403);

  await deleteRole(role);
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
