import { NextResponse } from "next/server";

import { createAuditLog } from "@/audit/logs";
import { addUserRole, getUserRolesByUserId } from "@/auth/openSQL";
import { PERMISSIONS, isValidRole } from "@/auth/permissions";
import { getMutableTargetUser, requireApiPermission } from "@/auth/userManagement";
import { guardSameOriginRequest } from "@/security/requestGuards";

export async function POST(request, { params }) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;

  const auth = await requireApiPermission(PERMISSIONS.MANAGE_ROLES);
  if (auth.error) return auth.error;

  const { userId } = await params;
  const target = await getMutableTargetUser(userId);
  if (target.error) return target.error;

  const { role } = await request.json().catch(() => ({}));
  if (!await isValidRole(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const beforeRoles = await getUserRolesByUserId(userId);
  await addUserRole(userId, role);
  const afterRoles = await getUserRolesByUserId(userId);
  await createAuditLog({
    type: "user_management",
    action: "user_role.added",
    actorUserId: auth.user.id,
    targetUserId: userId,
    summary: `${auth.user.username} added role ${role} to ${target.user.username}.`,
    beforeData: { roles: beforeRoles },
    afterData: { roles: afterRoles },
    metadata: { role },
  });
  return NextResponse.json({ ok: true });
}
