import { NextResponse } from "next/server";

import { listBugReports } from "@/bugs/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const bugs = listBugReports({
    q: searchParams.get("q")?.trim(),
    category: searchParams.getAll("category"),
    priority: searchParams.getAll("priority"),
    status: searchParams.getAll("status"),
  });
  return NextResponse.json({ bugs });
}
