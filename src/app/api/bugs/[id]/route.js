import { NextResponse } from "next/server";

import { getBugReportById } from "@/bugs/server";

export async function GET(_request, { params }) {
  const { id } = await params;

  try {
    const bug = await getBugReportById(decodeURIComponent(id));
    if (!bug) return NextResponse.json({ error: "Bug report not found." }, { status: 404 });
    return NextResponse.json({ bug }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Bug report could not be loaded." }, { status: 503 });
  }
}
