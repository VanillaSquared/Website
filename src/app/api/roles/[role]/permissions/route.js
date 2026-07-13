import { NextResponse } from "next/server";

import { createAuditLog } from "@/audit/logs";
import { getRole, getRoleIncludedRoles, getRolePermissions, listRoles, setRoleAuthorization, wouldCreateRoleInclusionCycle } from "@/auth/openSQL";
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
  const existingRoleNames = new Set((await listRoles()).map((item) => item.name));
  const requestedIncludedRoles = Array.isArray(body.includedRoles) ? body.includedRoles : [];
  const isValidIncludedRole = (includedRole) => isValidRoleName(includedRole) && existingRoleNames.has(includedRole) && includedRole !== role;
  if (!requestedIncludedRoles.every(isValidIncludedRole)) return jsonError("Invalid included role.", 400);
  const includedRoles = normalizePermissionList(requestedIncludedRoles, isValidIncludedRole);
  if (await wouldCreateRoleInclusionCycle(role, includedRoles)) return jsonError("Roles cannot include themselves, directly or indirectly.", 400);

  const beforePermissions = await getRolePermissions(role);
  const beforeIncludedRoles = await getRoleIncludedRoles(role);
  await setRoleAuthorization(role, normalizePermissionList(body.permissions, isValidPermission), includedRoles);
  const afterPermissions = await getRolePermissions(role);
  const afterIncludedRoles = await getRoleIncludedRoles(role);
  await createAuditLog({
    type: "user_management",
    action: "role_permissions.updated",
    actorUserId: auth.user.id,
    summary: `${auth.user.username} updated permissions for role ${role}.`,
    beforeData: { permissions: beforePermissions, includedRoles: beforeIncludedRoles },
    afterData: { permissions: afterPermissions, includedRoles: afterIncludedRoles },
    metadata: { role },
  });

  return NextResponse.json({ role, permissions: afterPermissions, includedRoles: afterIncludedRoles }, { headers: { "Cache-Control": "no-store" } });
}

export const PATCH = PUT;
