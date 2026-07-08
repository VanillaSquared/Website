import { NextResponse } from "next/server";

import { createAuditLog } from "@/audit/logs";
import { getUserRolesByUserId, removeUserRole } from "@/auth/openSQL";
import { PERMISSIONS, isValidRole } from "@/auth/permissions";
import { getMutableTargetUser, requireApiPermission } from "@/auth/userManagement";
import { guardSameOriginRequest } from "@/security/requestGuards";

export async function DELETE(request, { params }) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;

  const auth = await requireApiPermission(PERMISSIONS.MANAGE_ROLES);
  if (auth.error) return auth.error;

  const { userId, role } = await params;
  const target = await getMutableTargetUser(userId);
  if (target.error) return target.error;

  if (!await isValidRole(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const beforeRoles = await getUserRolesByUserId(userId);
  await removeUserRole(userId, role);
  const afterRoles = await getUserRolesByUserId(userId);
  await createAuditLog({
    type: "user_management",
    action: "user_role.removed",
    actorUserId: auth.user.id,
    targetUserId: userId,
    summary: `${auth.user.username} removed role ${role} from ${target.user.username}.`,
    beforeData: { roles: beforeRoles },
    afterData: { roles: afterRoles },
    metadata: { role },
  });
  return NextResponse.json({ ok: true });
}
