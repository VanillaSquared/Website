import { NextResponse } from "next/server";

import { PERMISSION_VALUES, ROLE_PERMISSIONS, ROLES } from "@/auth/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    roles: ROLES,
    permissions: PERMISSION_VALUES,
    rolePermissions: ROLE_PERMISSIONS,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
