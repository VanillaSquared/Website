import { NextResponse } from "next/server";

import { getAuthSubject } from "@/app/auth";
import { getUserById, removeUserPermission } from "@/auth/openSQL";
import { PERMISSIONS, hasPermission, isValidPermission } from "@/auth/permissions";

async function requireUserManagement() {
  const subject = await getAuthSubject({ updateTokens: false });
  const user = subject ? subject.properties : null;
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!await hasPermission(user, PERMISSIONS.USER_MANAGEMENT)) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { user };
}

export async function DELETE(_request, { params }) {
  const auth = await requireUserManagement();
  if (auth.error) return auth.error;

  const { userId, permission } = await params;

  if (!isValidPermission(permission)) return NextResponse.json({ error: "Invalid permission" }, { status: 400 });
  if (!await getUserById(userId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await removeUserPermission(userId, permission);
  return NextResponse.json({ ok: true });
}
