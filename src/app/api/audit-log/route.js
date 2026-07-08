import { NextResponse } from "next/server";

import { listAuditLogs, getAuditLogUsers, AUDIT_LOG_TYPES } from "@/audit/logs";
import { PERMISSIONS } from "@/auth/permissions";
import { requireApiPermission } from "@/auth/userManagement";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function values(params, name) {
  const repeated = params.getAll(name);
  const comma = repeated.flatMap((value) => String(value).split(","));
  return comma.map((value) => value.trim()).filter(Boolean);
}

export async function GET(request) {
  const auth = await requireApiPermission(PERMISSIONS.AUDIT_LOG);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const users = values(searchParams, "user").slice(0, 10);
  const types = values(searchParams, "type").filter((type) => AUDIT_LOG_TYPES.includes(type));
  const tab = searchParams.get("tab") || "all";

  const result = await listAuditLogs({
    search: searchParams.get("search") || "",
    users,
    types,
    tabType: tab,
    limit: searchParams.get("limit") || 30,
    cursor: searchParams.get("cursor"),
  });
  const auditUsers = await getAuditLogUsers();

  return NextResponse.json({ ...result, users: auditUsers, types: AUDIT_LOG_TYPES }, { headers: { "Cache-Control": "no-store" } });
}
