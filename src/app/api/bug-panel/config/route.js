import { NextResponse } from "next/server";

import { createAuditLog } from "@/audit/logs";
import { hasPermission, PERMISSIONS } from "@/auth/permissions";
import { jsonError, requireApiPermission } from "@/auth/userManagement";
import { getBugLimitConfig, updateBugLimitConfig } from "@/bugs/limits";
import { guardSameOriginRequest } from "@/security/requestGuards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireApiPermission(PERMISSIONS.BUG_PANEL);
  if (auth.error) return auth.error;

  return NextResponse.json({ config: await getBugLimitConfig() }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;

  const auth = await requireApiPermission(PERMISSIONS.BUG_PANEL);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  try {
    const beforeConfig = await getBugLimitConfig();
    if (body.lockdownEnabled !== beforeConfig.lockdownEnabled && !await hasPermission(auth.user, PERMISSIONS.LOCKDOWN)) {
      return jsonError("You do not have permission to change lockdown mode.", 403);
    }
    const config = await updateBugLimitConfig(body);
    await createAuditLog({
      type: "bug_panel_action",
      action: "bug_panel_config.updated",
      actorUserId: auth.user.id,
      summary: `${auth.user.username} updated bug panel configuration.`,
      beforeData: beforeConfig,
      afterData: config,
    });
    return NextResponse.json({ config }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error.message || "Could not update bug limit config.", error.status || 400);
  }
}
