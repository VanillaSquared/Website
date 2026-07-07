import { NextResponse } from "next/server";

import { listBugReports } from "@/bugs/reporter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  try {
    const bugs = await listBugReports({
      q: searchParams.get("q")?.trim(),
      category: searchParams.getAll("category").map((value) => value.trim()).filter(Boolean),
      priority: searchParams.getAll("priority").map((value) => value.trim()).filter(Boolean),
      status: searchParams.getAll("status").map((value) => value.trim()).filter(Boolean),
    });

    return NextResponse.json({ bugs });
  } catch (error) {
    console.error("Failed to list bug reports", error);
    return NextResponse.json({ error: "Failed to load bug reports." }, { status: 500 });
  }
}
