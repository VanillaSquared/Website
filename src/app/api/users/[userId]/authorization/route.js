import { NextResponse } from "next/server";

import { getUserById } from "@/auth/openSQL";
import { PERMISSIONS, getAuthorizationForUser } from "@/auth/permissions";
import { requireApiPermission } from "@/auth/userManagement";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const auth = await requireApiPermission(PERMISSIONS.USER_MANAGEMENT);
  if (auth.error) return auth.error;

  const { userId } = await params;
  const user = await getUserById(userId);

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ user, authorization: await getAuthorizationForUser(user) }, { headers: { "Cache-Control": "no-store" } });
}
