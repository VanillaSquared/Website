import { NextResponse } from "next/server";

import { getAuditLogUsers } from "@/audit/logs";
import { PERMISSIONS } from "@/auth/permissions";
import { requireApiPermission } from "@/auth/userManagement";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireApiPermission(PERMISSIONS.AUDIT_LOG);
  if (auth.error) return auth.error;

  return NextResponse.json({ users: await getAuditLogUsers() }, { headers: { "Cache-Control": "no-store" } });
}
