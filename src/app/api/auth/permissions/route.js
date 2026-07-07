import { NextResponse } from "next/server";

import { getAuthSubject } from "@/app/auth";
import { getAuthorizationForUser } from "@/auth/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  const subject = await getAuthSubject({ updateTokens: false });
  const user = subject ? subject.properties : null;

  return NextResponse.json(await getAuthorizationForUser(user), {
    headers: { "Cache-Control": "no-store" },
  });
}
