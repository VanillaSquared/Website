import { NextResponse } from "next/server";

import { getBugReportByPublicId } from "@/bugs/server";

export async function GET(_request, { params }) {
  const { bug } = await params;
  const bugReport = getBugReportByPublicId(decodeURIComponent(bug));
  if (!bugReport) return NextResponse.json({ error: "Bug report not found." }, { status: 404 });
  return NextResponse.json({ bug: bugReport });
}
