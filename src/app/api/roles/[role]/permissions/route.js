import { NextResponse } from "next/server";

import { createAuditLog } from "@/audit/logs";
import { getRole, getRolePermissions, setRolePermissions } from "@/auth/openSQL";
import { PERMISSIONS, isValidPermission, isValidRoleName } from "@/auth/permissions";
import { getMutableTargetRole, jsonError, normalizePermissionList, requireApiPermission } from "@/auth/userManagement";
import { guardSameOriginRequest } from "@/security/requestGuards";

export async function PUT(request, { params }) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;

  const auth = await requireApiPermission(PERMISSIONS.MANAGE_ROLES);
  if (auth.error) return auth.error;

  const { role } = await params;
  if (!isValidRoleName(role) || !await getRole(role)) return jsonError("Role not found.", 404);
  const targetRole = await getMutableTargetRole(role, auth.user);
  if (targetRole.error) return targetRole.error;

  const body = await request.json().catch(() => ({}));
  const beforePermissions = await getRolePermissions(role);
  await setRolePermissions(role, normalizePermissionList(body.permissions, isValidPermission));
  const afterPermissions = await getRolePermissions(role);
  await createAuditLog({
    type: "user_management",
    action: "role_permissions.updated",
    actorUserId: auth.user.id,
    summary: `${auth.user.username} updated permissions for role ${role}.`,
    beforeData: { permissions: beforePermissions },
    afterData: { permissions: afterPermissions },
    metadata: { role },
  });

  return NextResponse.json({ role, permissions: afterPermissions }, { headers: { "Cache-Control": "no-store" } });
}

export const PATCH = PUT;
