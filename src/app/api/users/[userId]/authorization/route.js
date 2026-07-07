import { NextResponse } from "next/server";

import { getAuthSubject } from "@/app/auth";
import { getUserById } from "@/auth/openSQL";
import { PERMISSIONS, getAuthorizationForUser, hasPermission } from "@/auth/permissions";

export const dynamic = "force-dynamic";

async function requireUserManagement() {
  const subject = await getAuthSubject({ updateTokens: false });
  const user = subject ? subject.properties : null;

  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!await hasPermission(user, PERMISSIONS.USER_MANAGEMENT)) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };

  return { user };
}

export async function GET(_request, { params }) {
  const auth = await requireUserManagement();
  if (auth.error) return auth.error;

  const { userId } = await params;
  const user = await getUserById(userId);

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ user, authorization: await getAuthorizationForUser(user) }, { headers: { "Cache-Control": "no-store" } });
}
