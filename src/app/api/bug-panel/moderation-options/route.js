import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/auth/permissions";
import { canManageUserByHierarchy, requireApiPermission } from "@/auth/userManagement";
import { listBugPanelUsers, PUNISHMENT_TYPE_OPTIONS } from "@/bugs/limits";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const auth = await requireApiPermission(PERMISSIONS.BUG_PANEL);
  if (auth.error) return auth.error;

  const users = await listBugPanelUsers();
  const manageableEntries = await Promise.all(users.map(async (user) => ({
    user,
    manageable: await canManageUserByHierarchy(auth.user, user),
  })));

  return NextResponse.json({
    users: manageableEntries.filter((entry) => entry.manageable).map((entry) => entry.user),
    types: PUNISHMENT_TYPE_OPTIONS,
  }, { headers: { "Cache-Control": "no-store" } });
}
