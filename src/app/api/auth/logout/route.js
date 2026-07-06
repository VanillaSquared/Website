import { NextResponse } from "next/server";

import { clearTokens, getAuthSubject } from "@/app/auth";
import { guardSameOriginRequest } from "@/security/requestGuards";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const blocked = guardSameOriginRequest(request);

  if (blocked) {
    return blocked;
  }

  const subject = await getAuthSubject({ updateTokens: false });

  if (!subject) {
    await clearTokens();

    return NextResponse.json({ error: "You are not logged in." }, {
      status: 401,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  await clearTokens();

  return NextResponse.json({ authenticated: false }, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
