import { NextResponse } from "next/server";

import { clearTokens, getAuthSubject } from "@/app/auth";

export const dynamic = "force-dynamic";

export async function POST() {
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
