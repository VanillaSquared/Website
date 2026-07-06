import "server-only";

import { NextResponse } from "next/server";

function getRequestHost(request) {
  return request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
}

function isTrustedSameOriginUrl(value, host) {
  if (!value || !host) {
    return true;
  }

  try {
    return new URL(value).host === host;
  } catch {
    return false;
  }
}

export function validateSameOriginRequest(request) {
  const host = getRequestHost(request);
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (!isTrustedSameOriginUrl(origin, host) || !isTrustedSameOriginUrl(referer, host)) {
    return "Cross-origin requests are not allowed.";
  }

  return null;
}

export function sameOriginErrorResponse(message = "Cross-origin requests are not allowed.") {
  return NextResponse.json({ error: message }, {
    status: 403,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export function guardSameOriginRequest(request) {
  const error = validateSameOriginRequest(request);
  return error ? sameOriginErrorResponse(error) : null;
}
