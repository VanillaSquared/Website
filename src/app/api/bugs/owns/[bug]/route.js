import { NextResponse } from "next/server";

import { getAuthSubject } from "@/app/auth";
import { checkBugReportOwnership } from "@/bugs/reporter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const subject = await getAuthSubject();
  const creatorUserId = subject?.properties?.id;

  if (!creatorUserId) {
    return NextResponse.json({ error: "You must be logged in to check bug report ownership." }, { status: 401 });
  }

  const { bug } = await params;

  try {
    const owns = await checkBugReportOwnership(decodeURIComponent(bug), creatorUserId);

    if (owns === null) {
      return NextResponse.json({ error: "Bug report not found." }, { status: 404 });
    }

    return NextResponse.json({ owns }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to check bug report ownership", error);
    return NextResponse.json({ error: "Failed to check bug report ownership." }, { status: 500 });
  }
}
