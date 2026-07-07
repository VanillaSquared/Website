import { NextResponse } from "next/server";

import { addUserPermission } from "@/auth/openSQL";
import { PERMISSIONS, isValidPermission } from "@/auth/permissions";
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

  const { permission } = await request.json().catch(() => ({}));
  if (!isValidPermission(permission)) return NextResponse.json({ error: "Invalid permission" }, { status: 400 });

  await addUserPermission(userId, permission);
  return NextResponse.json({ ok: true });
}
