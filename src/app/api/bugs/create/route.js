import { NextResponse } from "next/server";

import { getAuthSubject } from "@/app/auth";
import { PERMISSIONS, hasPermission } from "@/auth/permissions";
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

  if (!await hasPermission(user, PERMISSIONS.CREATE_BUGS)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Submit the report as multipart form data." }, { status: 400 });
  }

  try {
    const result = await createBugReport({ creatorUserId, formData });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ id: result.id, publicId: result.publicId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create bug report", error);
    return NextResponse.json({ error: "Failed to submit bug report." }, { status: 500 });
  }
}
