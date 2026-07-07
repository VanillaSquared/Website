import { NextResponse } from "next/server";

import { getAuthSubject } from "@/app/auth";
import { PERMISSIONS, hasPermission } from "@/auth/permissions";
import { listUsers } from "@/auth/openSQL";

export const dynamic = "force-dynamic";

async function requireUserManagement() {
  const subject = await getAuthSubject({ updateTokens: false });
  const user = subject ? subject.properties : null;

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!await hasPermission(user, PERMISSIONS.USER_MANAGEMENT)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user };
}

export async function GET() {
  const auth = await requireUserManagement();
  if (auth.error) return auth.error;

  return NextResponse.json({ users: await listUsers() }, { headers: { "Cache-Control": "no-store" } });
}
