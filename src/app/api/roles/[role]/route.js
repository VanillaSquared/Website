import { NextResponse } from "next/server";

import { createAuditLog } from "@/audit/logs";
import { deleteRole, getRole, getRolePermissions, renameRole, setRoleColor } from "@/auth/openSQL";
import { DEFAULT_ROLE, NOT_SIGNED_IN_ROLE, PERMISSIONS, isValidRoleColor, isValidRoleName } from "@/auth/permissions";
import { getMutableTargetRole, jsonError, normalizeRoleName, requireApiPermission } from "@/auth/userManagement";
import { guardSameOriginRequest } from "@/security/requestGuards";

const PROTECTED_ROLES = new Set([DEFAULT_ROLE, NOT_SIGNED_IN_ROLE, "support", "developer", "owner"]);

export async function PATCH(request, { params }) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;

  const auth = await requireApiPermission(PERMISSIONS.MANAGE_ROLES);
  if (auth.error) return auth.error;

  const { role } = await params;
  if (!isValidRoleName(role) || !await getRole(role)) return jsonError("Role not found.", 404);
  const targetRole = await getMutableTargetRole(role, auth.user);
  if (targetRole.error) return targetRole.error;

  const body = await request.json().catch(() => ({}));
  const name = normalizeRoleName(body.name ?? role);
  if (!isValidRoleName(name)) return jsonError("Invalid role name.", 400);
  if (PROTECTED_ROLES.has(role) && name !== role) return jsonError("Built-in roles cannot be renamed.", 403);
  if (name !== role && await getRole(name)) return jsonError("Role already exists.", 409);
  if (!isValidRoleColor(body.color)) return jsonError("Invalid role color.", 400);

  const beforeRole = { ...await getRole(role), permissions: await getRolePermissions(role) };
  const updatedRole = name === role ? await getRole(role) : await renameRole(role, name);
  await setRoleColor(name, body.color.toLowerCase());
  const afterRole = { ...updatedRole, color: body.color.toLowerCase(), permissions: await getRolePermissions(name) };
  await createAuditLog({
    type: "user_management",
    action: "role.renamed",
    actorUserId: auth.user.id,
    summary: `${auth.user.username} updated role ${role}.`,
    beforeData: beforeRole,
    afterData: afterRole,
  });
  return NextResponse.json({ role: afterRole }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request, { params }) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;

  const auth = await requireApiPermission(PERMISSIONS.MANAGE_ROLES);
  if (auth.error) return auth.error;

  const { role } = await params;
  if (!isValidRoleName(role) || !await getRole(role)) return jsonError("Role not found.", 404);
  const targetRole = await getMutableTargetRole(role, auth.user);
  if (targetRole.error) return targetRole.error;
  if (PROTECTED_ROLES.has(role)) return jsonError("Built-in roles cannot be deleted.", 403);

  const beforeRole = { ...await getRole(role), permissions: await getRolePermissions(role) };
  await deleteRole(role);
  await createAuditLog({
    type: "user_management",
    action: "role.deleted",
    actorUserId: auth.user.id,
    summary: `${auth.user.username} deleted role ${role}.`,
    beforeData: beforeRole,
  });
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
