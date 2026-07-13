import { NextResponse } from "next/server";

import { createAuditLog } from "@/audit/logs";
import { addUserPermission, getUserPermissionsByUserId } from "@/auth/openSQL";
import { PERMISSIONS, isValidPermission } from "@/auth/permissions";
import { getMutableTargetUser, requireApiPermission } from "@/auth/userManagement";
import { guardSameOriginRequest } from "@/security/requestGuards";

export async function POST(request, { params }) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;

  const auth = await requireApiPermission(PERMISSIONS.MANAGE_ROLES);
  if (auth.error) return auth.error;

  const { userId } = await params;
  const target = await getMutableTargetUser(userId, auth.user);
  if (target.error) return target.error;

  const { permission } = await request.json().catch(() => ({}));
  if (!isValidPermission(permission)) return NextResponse.json({ error: "Invalid permission" }, { status: 400 });

  const beforePermissions = await getUserPermissionsByUserId(userId);
  await addUserPermission(userId, permission);
  const afterPermissions = await getUserPermissionsByUserId(userId);
  await createAuditLog({
    type: "user_management",
    action: "user_permission.added",
    actorUserId: auth.user.id,
    targetUserId: userId,
    summary: `${auth.user.username} added permission ${permission} to ${target.user.username}.`,
    beforeData: { permissions: beforePermissions },
    afterData: { permissions: afterPermissions },
    metadata: { permission },
  });
  return NextResponse.json({ ok: true });
}
