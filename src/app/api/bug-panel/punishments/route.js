import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/auth/permissions";
import { jsonError, requireApiPermission } from "@/auth/userManagement";
import { listActiveBugPunishments, listBugPanelUsers, upsertBugPunishments } from "@/bugs/limits";
import { guardSameOriginRequest } from "@/security/requestGuards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireApiPermission(PERMISSIONS.BUG_PANEL);
  if (auth.error) return auth.error;

  const [punishments, users] = await Promise.all([listActiveBugPunishments(), listBugPanelUsers()]);
  return NextResponse.json({ punishments, users }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;

  const auth = await requireApiPermission(PERMISSIONS.BUG_PANEL);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  try {
    const punishments = await upsertBugPunishments(body.userIds, body.duration);
    return NextResponse.json({ punishments }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error.message || "Could not save punishments.", error.status || 400);
  }
}
