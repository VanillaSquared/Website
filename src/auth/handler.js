import { INTERNAL_AUTH_HEADER, verifyInternalAuthHeader } from "@/auth/internalAuthGuard";

import { authIssuer } from "./issuer";

export const runtime = "nodejs";

async function getFormBody(request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("application/x-www-form-urlencoded")) {
    return null;
  }

  return new URLSearchParams(await request.clone().text());
}

async function guardInternalAuthProvider(request) {
  if (request.method !== "POST") {
    return null;
  }

  const body = await getFormBody(request);

  if (body?.get("provider") !== "internal_email") {
    return null;
  }

  if (!verifyInternalAuthHeader(request.headers.get(INTERNAL_AUTH_HEADER), "internal_email")) {
    return new Response(JSON.stringify({ error: "Internal auth provider is not available to clients." }), {
      status: 403,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }

  return null;
}

export async function handleOpenAuth(request) {
  const blocked = await guardInternalAuthProvider(request);

  if (blocked) {
    return blocked;
  }

  try {
    return await authIssuer.fetch(request);
  } catch (error) {
    if (error?.message?.includes("browser was in an unknown state")) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "Your login session expired. Please try again.");
      return Response.redirect(loginUrl, 302);
    }

    throw error;
  }
}
