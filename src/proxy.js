import { NextResponse } from "next/server";

import { VISITOR_ID_COOKIE, VISITOR_ID_HEADER, VISITOR_ID_MAX_AGE, isValidVisitorId } from "@/experiments/visitorIdentity";

export function proxy(request) {
  const existingId = request.cookies.get(VISITOR_ID_COOKIE)?.value;
  const visitorId = isValidVisitorId(existingId) ? existingId : crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(VISITOR_ID_HEADER, visitorId);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (visitorId !== existingId) {
    response.cookies.set({
      name: VISITOR_ID_COOKIE,
      value: visitorId,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: VISITOR_ID_MAX_AGE,
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
