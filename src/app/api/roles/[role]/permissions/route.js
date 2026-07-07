import { NextResponse } from "next/server";

import { getRole, getRolePermissions, setRolePermissions } from "@/auth/openSQL";
import { PERMISSIONS, isValidPermission, isValidRoleName } from "@/auth/permissions";
import { jsonError, normalizePermissionList, requireApiPermission } from "@/auth/userManagement";
import { guardSameOriginRequest } from "@/security/requestGuards";

export async function PUT(request, { params }) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;

  const auth = await requireApiPermission(PERMISSIONS.MANAGE_ROLES);
  if (auth.error) return auth.error;

  const { role } = await params;
  if (!isValidRoleName(role) || !await getRole(role)) return jsonError("Role not found.", 404);

  const body = await request.json().catch(() => ({}));
  await setRolePermissions(role, normalizePermissionList(body.permissions, isValidPermission));

  return NextResponse.json({ role, permissions: await getRolePermissions(role) }, { headers: { "Cache-Control": "no-store" } });
}

export const PATCH = PUT;
