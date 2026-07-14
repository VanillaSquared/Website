import { NextResponse } from "next/server";

import { getAuthSubject } from "@/app/auth";
import { PERMISSIONS, hasPermission } from "@/auth/permissions";
import { getUserPreferences, updateUserPreferences } from "@/auth/userPreferences";
import { guardSameOriginRequest } from "@/security/requestGuards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function error(message, status) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

async function developerUser() {
  const subject = await getAuthSubject();
  const user = subject?.properties;
  if (!user?.id) return { error: error("You must be logged in.", 401) };
  if (!await hasPermission(user, PERMISSIONS.DEV_OPTIONS)) return { error: error("Forbidden", 403) };
  return { user };
}

export async function GET() {
  const context = await developerUser();
  if (context.error) return context.error;
  return NextResponse.json({ preferences: await getUserPreferences(context.user.id) }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;
  const context = await developerUser();
  if (context.error) return context.error;
  const body = await request.json().catch(() => ({}));
  if (Object.keys(body).length !== 1 || !("developerMode" in body)) return error("Choose one valid preference.", 400);
  try {
    const preferences = await updateUserPreferences(context.user.id, { developerMode: body.developerMode });
    return NextResponse.json({ preferences }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    return error(cause.message || "Could not update preferences.", cause.status ?? 500);
  }
}
