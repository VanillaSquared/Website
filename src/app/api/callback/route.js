import { NextResponse } from "next/server";

import { getAuthClient, setTokens } from "@/app/auth";

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  const client = getAuthClient(url.origin);
  const exchanged = await client.exchange(code, `${url.origin}/api/callback`);

  if (exchanged.err) {
    return NextResponse.json({ error: "Could not complete login" }, { status: 400 });
  }

  await setTokens(exchanged.tokens.access, exchanged.tokens.refresh);

  return NextResponse.redirect(url.origin);
}
