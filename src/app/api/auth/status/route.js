import { NextResponse } from "next/server";

import { getAuthSubject } from "@/app/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const subject = await getAuthSubject({ updateTokens: false });
  const authenticated = Boolean(subject);

  const user = subject ? {
    id: subject.properties?.id,
    username: subject.properties?.username,
    email: subject.properties?.email,
  } : null;

  return NextResponse.json({ authenticated, user }, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
