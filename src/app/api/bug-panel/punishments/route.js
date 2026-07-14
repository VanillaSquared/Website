import { NextResponse } from "next/server";

import { createAuditLog } from "@/audit/logs";
import { PERMISSIONS } from "@/auth/permissions";
import { canManageUserByHierarchy, getMutableTargetUser, jsonError, requireApiPermission } from "@/auth/userManagement";
import { createBugPunishments, listBugPanelUsers, listBugPunishments, PUNISHMENT_TYPE_OPTIONS } from "@/bugs/limits";
import { guardSameOriginRequest } from "@/security/requestGuards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireApiPermission(PERMISSIONS.BUG_PANEL);
  if (auth.error) return auth.error;

  const [punishments, users] = await Promise.all([listBugPunishments(), listBugPanelUsers()]);
  const manageableEntries = await Promise.all(users.map(async (user) => ({ user, manageable: await canManageUserByHierarchy(auth.user, user) })));
  const manageableUsers = manageableEntries.filter((entry) => entry.manageable).map((entry) => entry.user);
  const manageableIds = new Set(manageableUsers.map((user) => user.id));
  return NextResponse.json({
    punishments: punishments.filter((punishment) => manageableIds.has(punishment.userId)),
    users: manageableUsers,
    types: PUNISHMENT_TYPE_OPTIONS,
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;
  const auth = await requireApiPermission(PERMISSIONS.BUG_PANEL);
  if (auth.error) return auth.error;
  const body = await request.json().catch(() => ({}));

  try {
    const userIds = Array.isArray(body.userIds) ? [...new Set(body.userIds.map((id) => String(id ?? "").trim()).filter(Boolean))] : [];
    for (const userId of userIds) {
      const target = await getMutableTargetUser(userId, auth.user);
      if (target.error) return target.error;
    }
    const punishments = await createBugPunishments(userIds, body.types, body.duration);
    await createAuditLog({
      type: "bug_panel_action",
      action: "bug_punishments.created",
      actorUserId: auth.user.id,
      summary: `${auth.user.username} created bug-report punishments.`,
      afterData: { punishments },
      metadata: { affectedUserIds: userIds, types: body.types },
    });
    return NextResponse.json({ punishments }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error.message || "Could not save punishments.", error.status || 400);
  }
}
