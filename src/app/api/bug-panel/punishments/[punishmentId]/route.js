import { NextResponse } from "next/server";

import { createAuditLog } from "@/audit/logs";
import { PERMISSIONS } from "@/auth/permissions";
import { getMutableTargetUser, jsonError, requireApiPermission } from "@/auth/userManagement";
import { getBugPunishment, revokeBugPunishment, updateBugPunishment } from "@/bugs/limits";
import { guardSameOriginRequest } from "@/security/requestGuards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getPunishmentContext(context, actor) {
  const params = await context.params;
  const id = String(params?.punishmentId ?? "").trim();
  const punishment = await getBugPunishment(id);
  if (!punishment) return { error: jsonError("Punishment not found.", 404) };
  const target = await getMutableTargetUser(punishment.userId, actor);
  if (target.error) return target;
  return { id, punishment };
}

export async function PATCH(request, context) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;
  const auth = await requireApiPermission(PERMISSIONS.BUG_PANEL);
  if (auth.error) return auth.error;
  const target = await getPunishmentContext(context, auth.user);
  if (target.error) return target.error;
  const body = await request.json().catch(() => ({}));
  try {
    const punishment = await updateBugPunishment(target.id, body.duration);
    await createAuditLog({
      type: "bug_panel_action",
      action: "bug_punishment.updated",
      actorUserId: auth.user.id,
      targetUserId: punishment.userId,
      summary: `${auth.user.username} updated a bug-report punishment.`,
      beforeData: target.punishment,
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
  const target = await getPunishmentContext(context, auth.user);
  if (target.error) return target.error;
  try {
    const punishment = await revokeBugPunishment(target.id, auth.user.id);
    await createAuditLog({
      type: "bug_panel_action",
      action: "bug_punishment.revoked",
      actorUserId: auth.user.id,
      targetUserId: punishment.userId,
      summary: `${auth.user.username} revoked a bug-report punishment.`,
      beforeData: target.punishment,
      afterData: punishment,
    });
    return NextResponse.json({ punishment }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error.message || "Could not revoke punishment.", error.status || 400);
  }
}
