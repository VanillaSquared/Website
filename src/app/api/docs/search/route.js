import { NextResponse } from "next/server";

import { searchDocuments } from "@/docs/server";

const MAX_QUERY_LENGTH = 100;

export async function GET(request) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: "Search queries must be 100 characters or fewer." }, { status: 400 });
  }

  const results = query ? searchDocuments(query) : [];
  return NextResponse.json({ results }, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
