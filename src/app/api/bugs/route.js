import { NextResponse } from "next/server";

import { getAuthSubject } from "@/app/auth";
import { createBugReport, listBugReports } from "@/bugs/reporter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  try {
    const bugs = await listBugReports({
      q: searchParams.get("q")?.trim(),
      category: searchParams.get("category")?.trim(),
      priority: searchParams.get("priority")?.trim(),
      status: searchParams.get("status")?.trim(),
    });

    return NextResponse.json({ bugs });
  } catch (error) {
    console.error("Failed to list bug reports", error);
    return NextResponse.json({ error: "Failed to load bug reports." }, { status: 500 });
  }
}

export async function POST(request) {
  const subject = await getAuthSubject();
  const creatorUserId = subject?.properties?.id;

  if (!creatorUserId) {
    return NextResponse.json({ error: "You must be logged in to submit a bug report." }, { status: 401 });
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
