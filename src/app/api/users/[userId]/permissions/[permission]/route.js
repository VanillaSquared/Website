import { NextResponse } from "next/server";

import { removeUserPermission } from "@/auth/openSQL";
import { PERMISSIONS, isValidPermission } from "@/auth/permissions";
import { getMutableTargetUser, requireApiPermission } from "@/auth/userManagement";
import { guardSameOriginRequest } from "@/security/requestGuards";

export async function DELETE(request, { params }) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;

  const auth = await requireApiPermission(PERMISSIONS.MANAGE_ROLES);
  if (auth.error) return auth.error;

  const { userId, permission } = await params;
  const target = await getMutableTargetUser(userId);
  if (target.error) return target.error;

  if (!isValidPermission(permission)) return NextResponse.json({ error: "Invalid permission" }, { status: 400 });

  await removeUserPermission(userId, permission);
  return NextResponse.json({ ok: true });
}
