import { NextResponse } from "next/server";

import { cookies } from "next/headers";

import { getAuthClient, setTokens } from "@/app/auth";
import { PENDING_LOGIN_EMAIL_COOKIE, PENDING_SIGNUP_USERNAME_COOKIE } from "@/auth/issuer";

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

  const cookieStore = await cookies();
  cookieStore.delete(PENDING_LOGIN_EMAIL_COOKIE);
  cookieStore.delete(PENDING_SIGNUP_USERNAME_COOKIE);

  return NextResponse.redirect(url.origin);
}
