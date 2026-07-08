import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/auth/permissions";
import { jsonError, requireApiPermission } from "@/auth/userManagement";
import { removeBugPunishment, updateBugPunishment } from "@/bugs/limits";
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
    return NextResponse.json({ punishment: await updateBugPunishment(userId, body.duration) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error.message || "Could not update punishment.", error.status || 400);
  }
}

export async function DELETE(request, context) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;

  const auth = await requireApiPermission(PERMISSIONS.BUG_PANEL);
  if (auth.error) return auth.error;

  await removeBugPunishment(await getUserId(context));
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
