import { NextResponse } from "next/server";

import { getAuthSubject, getTokenCookies } from "@/app/auth";
import { getUserPermissions } from "@/auth/permissions";

export const dynamic = "force-dynamic";

const TOKEN_COOKIE_NAMES = {
  accessToken: "access_token",
  refreshToken: "refresh_token",
};

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

  return Buffer.from(padded, "base64").toString("utf8");
}

function getJwtPart(token, index) {
  try {
    const part = token.split(".")[index];

    if (!part) {
      return null;
    }

    return JSON.parse(decodeBase64Url(part));
  } catch {
    return null;
  }
}

function getTokenInfo(token, cookieName) {
  const payload = token ? getJwtPart(token, 1) : null;
  const expiresAt = typeof payload?.exp === "number" ? new Date(payload.exp * 1000).toISOString() : null;
  const expiresInSeconds = typeof payload?.exp === "number" ? Math.max(0, payload.exp - Math.floor(Date.now() / 1000)) : null;

  return {
    present: Boolean(token),
    cookieName,
    httpOnly: true,
    rawToken: token ? "hidden (httpOnly cookie)" : null,
    type: token?.includes(".") ? "jwt" : token ? "opaque" : null,
    header: token ? getJwtPart(token, 0) : null,
    payload,
    expiresAt,
    expiresInSeconds,
  };
}

export async function GET(request) {
  const subject = await getAuthSubject({ updateTokens: false });
  const authenticated = Boolean(subject);
  const includeTokens = new URL(request.url).searchParams.get("includeTokens") === "1";

  const user = subject ? {
    id: subject.properties?.id,
    uuid: subject.properties?.id,
    username: subject.properties?.username,
    email: subject.properties?.email,
  } : null;

  const permissions = await getUserPermissions(user);
  const body = { authenticated, user, permissions };

  if (includeTokens && permissions.canViewStaffSettings) {
    const tokens = await getTokenCookies();

    body.tokens = {
      accessToken: getTokenInfo(tokens.accessToken, TOKEN_COOKIE_NAMES.accessToken),
      refreshToken: getTokenInfo(tokens.refreshToken, TOKEN_COOKIE_NAMES.refreshToken),
    };
  }

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
