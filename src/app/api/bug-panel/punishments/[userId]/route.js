import { NextResponse } from "next/server";

import { createAuditLog } from "@/audit/logs";
import { PERMISSIONS } from "@/auth/permissions";
import { jsonError, requireApiPermission } from "@/auth/userManagement";
import { getActiveBugPunishment, removeBugPunishment, updateBugPunishment } from "@/bugs/limits";
import { guardSameOriginRequest } from "@/security/requestGuards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getUserId(context) {
  const params = await context.params;
  return String(params?.userId ?? "").trim();
}

export async function PATCH(request, context) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;

  const auth = await requireApiPermission(PERMISSIONS.BUG_PANEL);
  if (auth.error) return auth.error;

  const userId = await getUserId(context);
  const body = await request.json().catch(() => ({}));

  try {
    const beforePunishment = await getActiveBugPunishment(userId);
    const punishment = await updateBugPunishment(userId, body.duration);
    await createAuditLog({
      type: "bug_panel_action",
      action: "bug_punishment.updated",
      actorUserId: auth.user.id,
      targetUserId: userId,
      summary: `${auth.user.username} updated a bug-report punishment.`,
      beforeData: beforePunishment,
      afterData: punishment,
    });
    return NextResponse.json({ punishment }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error.message || "Could not update punishment.", error.status || 400);
  }
}

export async function DELETE(request, context) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;

  const auth = await requireApiPermission(PERMISSIONS.BUG_PANEL);
  if (auth.error) return auth.error;

  const userId = await getUserId(context);
  const beforePunishment = await getActiveBugPunishment(userId);
  await removeBugPunishment(userId);
  await createAuditLog({
    type: "bug_panel_action",
    action: "bug_punishment.removed",
    actorUserId: auth.user.id,
    targetUserId: userId,
    summary: `${auth.user.username} removed a bug-report punishment.`,
    beforeData: beforePunishment,
  });
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
