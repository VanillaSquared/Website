import { NextResponse } from "next/server";

import { getRolePermissions, listRoles } from "@/auth/openSQL";
import { PERMISSION_VALUES } from "@/auth/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  const roles = await listRoles();
  const rolePermissions = Object.fromEntries(await Promise.all(roles.map(async (role) => [role.name, await getRolePermissions(role.name)])));

  return NextResponse.json({
    roles: roles.map((role) => role.name),
    permissions: PERMISSION_VALUES,
    rolePermissions,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
