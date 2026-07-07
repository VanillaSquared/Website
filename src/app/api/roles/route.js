import { NextResponse } from "next/server";

import { createRole, getRole, getRolePermissions, listRoles } from "@/auth/openSQL";
import { PERMISSIONS, isValidPermission, isValidRoleName } from "@/auth/permissions";
import { jsonError, normalizePermissionList, normalizeRoleName, requireApiPermission } from "@/auth/userManagement";
import { guardSameOriginRequest } from "@/security/requestGuards";

export const dynamic = "force-dynamic";

async function rolesWithPermissions() {
  const roles = await listRoles();
  return Promise.all(roles.map(async (role) => ({ ...role, permissions: await getRolePermissions(role.name) })));
}

export async function GET() {
  const auth = await requireApiPermission(PERMISSIONS.USER_MANAGEMENT);
  if (auth.error) return auth.error;

  return NextResponse.json({ roles: await rolesWithPermissions() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;

  const auth = await requireApiPermission(PERMISSIONS.MANAGE_ROLES);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const name = normalizeRoleName(body.name);
  if (!isValidRoleName(name)) return jsonError("Invalid role name.", 400);
  if (await getRole(name)) return jsonError("Role already exists.", 409);

  const role = await createRole(name, normalizePermissionList(body.permissions, isValidPermission));
  return NextResponse.json({ role: { ...role, permissions: await getRolePermissions(name) } }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
