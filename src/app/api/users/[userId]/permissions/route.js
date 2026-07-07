import { NextResponse } from "next/server";

import { getAuthSubject } from "@/app/auth";
import { addUserPermission, getUserById } from "@/auth/openSQL";
import { PERMISSIONS, hasPermission, isValidPermission } from "@/auth/permissions";

async function requireUserManagement() {
  const subject = await getAuthSubject({ updateTokens: false });
  const user = subject ? subject.properties : null;
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!await hasPermission(user, PERMISSIONS.USER_MANAGEMENT)) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { user };
}

export async function POST(request, { params }) {
  const auth = await requireUserManagement();
  if (auth.error) return auth.error;

  const { userId } = await params;
  const { permission } = await request.json().catch(() => ({}));

  if (!isValidPermission(permission)) return NextResponse.json({ error: "Invalid permission" }, { status: 400 });
  if (!await getUserById(userId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await addUserPermission(userId, permission);
  return NextResponse.json({ ok: true });
}
