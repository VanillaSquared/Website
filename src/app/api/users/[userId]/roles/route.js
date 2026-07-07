import { NextResponse } from "next/server";

import { addUserRole } from "@/auth/openSQL";
import { PERMISSIONS, isValidRole } from "@/auth/permissions";
import { getMutableTargetUser, requireApiPermission } from "@/auth/userManagement";
import { guardSameOriginRequest } from "@/security/requestGuards";

export async function POST(request, { params }) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;

  const auth = await requireApiPermission(PERMISSIONS.MANAGE_ROLES);
  if (auth.error) return auth.error;

  const { userId } = await params;
  const target = await getMutableTargetUser(userId);
  if (target.error) return target.error;

  const { role } = await request.json().catch(() => ({}));
  if (!await isValidRole(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  await addUserRole(userId, role);
  return NextResponse.json({ ok: true });
}
