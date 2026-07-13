import { NextResponse } from "next/server";

import { createAuditLog } from "@/audit/logs";
import { PERMISSIONS } from "@/auth/permissions";
import { canManageUserByHierarchy, getMutableTargetUser, jsonError, requireApiPermission } from "@/auth/userManagement";
import { getActiveBugPunishment, listActiveBugPunishments, listBugPanelUsers, upsertBugPunishments } from "@/bugs/limits";
import { guardSameOriginRequest } from "@/security/requestGuards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireApiPermission(PERMISSIONS.BUG_PANEL);
  if (auth.error) return auth.error;

  const [punishments, users] = await Promise.all([listActiveBugPunishments(), listBugPanelUsers()]);
  const manageableEntries = await Promise.all(users.map(async (user) => ({
    user,
    manageable: await canManageUserByHierarchy(auth.user, user),
  })));
  const manageableUsers = manageableEntries.filter((entry) => entry.manageable).map((entry) => entry.user);
  const manageableUserIds = new Set(manageableUsers.map((user) => user.id));
  return NextResponse.json({
    punishments: punishments.filter((punishment) => manageableUserIds.has(punishment.userId)),
    users: manageableUsers,
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;

  const auth = await requireApiPermission(PERMISSIONS.BUG_PANEL);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  try {
    const affectedUserIds = Array.isArray(body.userIds) ? [...new Set(body.userIds.map((id) => String(id ?? "").trim()).filter(Boolean))] : [];
    for (const userId of affectedUserIds) {
      const target = await getMutableTargetUser(userId, auth.user);
      if (target.error) return target.error;
    }
    const beforePunishments = await Promise.all(affectedUserIds.map((id) => getActiveBugPunishment(id)));
    const punishments = await upsertBugPunishments(body.userIds, body.duration);
    const afterPunishments = await Promise.all(affectedUserIds.map((id) => getActiveBugPunishment(id)));
    await createAuditLog({
      type: "bug_panel_action",
      action: "bug_punishments.upserted",
      actorUserId: auth.user.id,
      summary: `${auth.user.username} saved bug-report punishments.`,
      beforeData: { punishments: beforePunishments },
      afterData: { punishments: afterPunishments, duration: body.duration },
      metadata: { affectedUserIds },
    });
    return NextResponse.json({ punishments }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error.message || "Could not save punishments.", error.status || 400);
  }
}
