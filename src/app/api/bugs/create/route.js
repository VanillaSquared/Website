import { NextResponse } from "next/server";

import { getAuthSubject } from "@/app/auth";
import { createAuditLog } from "@/audit/logs";
import { PERMISSIONS, getAuthorizationForUser, hasResolvedPermission } from "@/auth/permissions";
import { createBugReport } from "@/bugs/reporter";
import { guardSameOriginRequest } from "@/security/requestGuards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  const blocked = guardSameOriginRequest(request);

  if (blocked) {
    return blocked;
  }

  const subject = await getAuthSubject();
  const user = subject?.properties;
  const creatorUserId = user?.id;

  if (!creatorUserId) {
    return NextResponse.json({ error: "You must be logged in to submit a bug report." }, { status: 401 });
  }

  const authorization = await getAuthorizationForUser(user);

  if (!hasResolvedPermission(authorization, PERMISSIONS.CREATE_BUGS)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Submit the report as multipart form data." }, { status: 400 });
  }

  try {
    const result = await createBugReport({
      creatorUserId,
      formData,
      bypassLimits: hasResolvedPermission(authorization, PERMISSIONS.BYPASS_LIMITS),
      bypassLockdown: hasResolvedPermission(authorization, PERMISSIONS.BUG_PANEL),
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await createAuditLog({
      type: "bug_reporter_action",
      action: "bug_report.created",
      actorUserId: creatorUserId,
      targetUserId: creatorUserId,
      summary: `${user.username} created bug report ${result.publicId}.`,
      afterData: { id: result.id, publicId: result.publicId, allowComments: result.allowComments },
    });

    return NextResponse.json({ id: result.id, publicId: result.publicId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create bug report", error);
    return NextResponse.json({ error: "Failed to submit bug report." }, { status: 500 });
  }
}
