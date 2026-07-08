import { NextResponse } from "next/server";

import { clearTokens, getAuthSubject } from "@/app/auth";
import { createAuditLog } from "@/audit/logs";
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

  await createAuditLog({
    type: "user_action",
    action: "auth.logout",
    actorUserId: subject.properties.id,
    targetUserId: subject.properties.id,
    summary: `${subject.properties.username} logged out.`,
  });
  await clearTokens();

  return NextResponse.json({ authenticated: false }, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
