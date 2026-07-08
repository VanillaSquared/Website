import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/auth/permissions";
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
    return NextResponse.json({ config: await updateBugLimitConfig(body) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error.message || "Could not update bug limit config.", error.status || 400);
  }
}
