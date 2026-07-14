import { NextResponse } from "next/server";

import { getAuthSubject } from "@/app/auth";
import { createAuditLog } from "@/audit/logs";
import { PERMISSIONS, getAuthorizationForUser, hasResolvedPermission } from "@/auth/permissions";
import { createComment, listComments } from "@/bugs/comments";
import { guardSameOriginRequest } from "@/security/requestGuards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function error(message, status) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

function publicId(value) {
  try {
    const decoded = decodeURIComponent(value);
    return /^[a-z0-9-]{3,32}$/i.test(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

export async function GET(_request, { params }) {
  const subject = await getAuthSubject({ updateTokens: false });
  const user = subject?.properties;
  const authorization = await getAuthorizationForUser(user);
  if (!hasResolvedPermission(authorization, PERMISSIONS.VIEW_BUGS)) return error(user ? "Forbidden" : "Sign in required", user ? 403 : 401);
  const { bug } = await params;
  const id = publicId(bug);
  if (!id) return error("Bug report not found.", 404);
  return NextResponse.json({ comments: await listComments(id, user?.id ?? null) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request, { params }) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;
  const subject = await getAuthSubject();
  const user = subject?.properties;
  if (!user?.id) return error("You must be logged in to comment.", 401);
  const authorization = await getAuthorizationForUser(user);
  const { bug } = await params;
  const id = publicId(bug);
  if (!id) return error("Bug report not found.", 404);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) return error("Submit multipart form data.", 400);

  try {
    const formData = await request.formData();
    const comment = await createComment({
      publicId: id,
      actorUserId: user.id,
      canWrite: hasResolvedPermission(authorization, PERMISSIONS.WRITE_COMMENTS),
      bypassLimits: hasResolvedPermission(authorization, PERMISSIONS.BYPASS_LIMITS),
      bypassLockdown: hasResolvedPermission(authorization, PERMISSIONS.BUG_PANEL),
      siteHostname: new URL(request.url).hostname,
      formData,
    });
    if (comment.error) return error(comment.error, comment.status ?? 400);
    await createAuditLog({
      type: "comment_action",
      action: "bug_comment.created",
      actorUserId: user.id,
      targetUserId: user.id,
      summary: `${user.username} commented on bug report ${id}.`,
      afterData: comment,
      metadata: { publicId: id, commentId: comment.id },
    });
    return NextResponse.json({ comment }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("Failed to create bug comment", cause);
    return error("Failed to create comment.", 500);
  }
}
