import { NextResponse } from "next/server";

import { createAuditLog } from "@/audit/logs";
import { createRole, getRole, getRolePermissions, listRoles, reorderRoles } from "@/auth/openSQL";
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

  const permissions = normalizePermissionList(body.permissions, isValidPermission);
  const role = await createRole(name, permissions);
  const roleWithPermissions = { ...role, permissions: await getRolePermissions(name) };
  await createAuditLog({
    type: "user_management",
    action: "role.created",
    actorUserId: auth.user.id,
    summary: `${auth.user.username} created role ${name}.`,
    afterData: roleWithPermissions,
  });
  return NextResponse.json({ role: roleWithPermissions }, { status: 201, headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;

  const auth = await requireApiPermission(PERMISSIONS.MANAGE_ROLES);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const roles = Array.isArray(body.roles) ? body.roles.map(normalizeRoleName) : [];
  if (!roles.length || !roles.every(isValidRoleName)) return jsonError("Invalid role hierarchy.", 400);

  const beforeRoles = await rolesWithPermissions();
  try {
    await reorderRoles(roles);
  } catch (error) {
    return jsonError(error.message || "Could not update role hierarchy.", error.status || 400);
  }

  const afterRoles = await rolesWithPermissions();
  await createAuditLog({
    type: "user_management",
    action: "roles.reordered",
    actorUserId: auth.user.id,
    summary: `${auth.user.username} changed role hierarchy.`,
    beforeData: { roles: beforeRoles.map((role) => role.name) },
    afterData: { roles: afterRoles.map((role) => role.name) },
  });

  return NextResponse.json({ roles: afterRoles }, { headers: { "Cache-Control": "no-store" } });
}
