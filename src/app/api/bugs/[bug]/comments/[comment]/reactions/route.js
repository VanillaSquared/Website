import { NextResponse } from "next/server";

import { getAuthSubject } from "@/app/auth";
import { PERMISSIONS, getAuthorizationForUser, hasResolvedPermission } from "@/auth/permissions";
import { toggleCommentReaction } from "@/bugs/comments";
import { guardSameOriginRequest } from "@/security/requestGuards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function error(message, status) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request, { params }) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;
  const subject = await getAuthSubject();
  const user = subject?.properties;
  if (!user?.id) return error("You must be logged in to react.", 401);
  const authorization = await getAuthorizationForUser(user);
  if (!hasResolvedPermission(authorization, PERMISSIONS.WRITE_COMMENTS)) return error("Forbidden", 403);
  const values = await params;
  const publicId = decodeURIComponent(String(values.bug ?? ""));
  const commentId = String(values.comment ?? "");
  if (!/^[a-z0-9-]{3,32}$/i.test(publicId) || !/^[0-9a-f-]{36}$/i.test(commentId)) return error("Comment not found.", 404);
  const body = await request.json().catch(() => ({}));
  const result = await toggleCommentReaction({ publicId, commentId, actorUserId: user.id, emoji: body.emoji });
  if (result.error) return error(result.error, result.status ?? 400);
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
