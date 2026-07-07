import { NextResponse } from "next/server";

import { getAuthSubject } from "@/app/auth";
import { PERMISSIONS, hasPermission } from "@/auth/permissions";
import { getBugReportByPublicId } from "@/bugs/reporter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const subject = await getAuthSubject({ updateTokens: false });
  const user = subject?.properties;

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await hasPermission(user, PERMISSIONS.VIEW_BUGS)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { bug } = await params;

  try {
    const bugReport = await getBugReportByPublicId(decodeURIComponent(bug));

    if (!bugReport) {
      return NextResponse.json({ error: "Bug report not found." }, { status: 404 });
    }

    return NextResponse.json({ bug: bugReport });
  } catch (error) {
    console.error("Failed to load bug report", error);
    return NextResponse.json({ error: "Failed to load bug report." }, { status: 500 });
  }
}
