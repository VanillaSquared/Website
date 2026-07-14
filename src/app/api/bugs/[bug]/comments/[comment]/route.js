import { NextResponse } from "next/server";

import { getAuthSubject } from "@/app/auth";
import { createAuditLog } from "@/audit/logs";
import { PERMISSIONS, getAuthorizationForUser, hasResolvedPermission } from "@/auth/permissions";
import { deleteComment, getComment, updateComment } from "@/bugs/comments";
import { checkLockdownAllowed } from "@/bugs/limits";
import { getBugReportByPublicId } from "@/bugs/reporter";
import { guardSameOriginRequest } from "@/security/requestGuards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function responseError(message, status) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

async function contextFor(params, user) {
  const values = await params;
  let publicId;
  try { publicId = decodeURIComponent(values.bug); } catch { return null; }
  const commentId = String(values.comment ?? "");
  if (!/^[a-z0-9-]{3,32}$/i.test(publicId) || !/^[0-9a-f-]{36}$/i.test(commentId)) return null;
  const [bug, comment] = await Promise.all([getBugReportByPublicId(publicId, { seed: false }), getComment(commentId)]);
  if (!bug || !comment || comment.bugReportId !== bug.id) return null;
  return { publicId, commentId, comment, authorization: await getAuthorizationForUser(user) };
}

async function authenticatedContext(params) {
  const subject = await getAuthSubject();
  const user = subject?.properties;
  if (!user?.id) return { error: responseError("You must be logged in.", 401) };
  const context = await contextFor(params, user);
  if (!context) return { error: responseError("Comment not found.", 404) };
  return { ...context, user };
}

export async function PATCH(request, { params }) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;
  const context = await authenticatedContext(params);
  if (context.error) return context.error;
  const body = await request.json().catch(() => ({}));
  const canManage = hasResolvedPermission(context.authorization, PERMISSIONS.MANAGE_COMMENTS);
  if (!canManage && !hasResolvedPermission(context.authorization, PERMISSIONS.WRITE_COMMENTS)) return responseError("Forbidden", 403);
  try {
    const result = await updateComment({
      commentId: context.commentId,
      actorUserId: context.user.id,
      canManage,
      bypassLimits: hasResolvedPermission(context.authorization, PERMISSIONS.BYPASS_LIMITS),
      bypassLockdown: hasResolvedPermission(context.authorization, PERMISSIONS.BUG_PANEL),
      siteHostname: new URL(request.url).hostname,
      content: body.content,
    });
    if (result.error) return responseError(result.error, result.status ?? 400);
    await createAuditLog({
      type: "comment_action",
      action: "bug_comment.updated",
      actorUserId: context.user.id,
      targetUserId: result.after.creatorUserId,
      summary: `${context.user.username} edited a comment on ${context.publicId}.`,
      beforeData: result.before,
      afterData: result.after,
      metadata: { publicId: context.publicId, commentId: context.commentId },
    });
    return NextResponse.json({ comment: result.after }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("Failed to update bug comment", cause);
    return responseError("Failed to update comment.", 500);
  }
}

export async function DELETE(request, { params }) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;
  const context = await authenticatedContext(params);
  if (context.error) return context.error;
  const canManage = hasResolvedPermission(context.authorization, PERMISSIONS.MANAGE_COMMENTS);
  if (!canManage && !hasResolvedPermission(context.authorization, PERMISSIONS.WRITE_COMMENTS)) return responseError("Forbidden", 403);
  const lockdown = await checkLockdownAllowed({ bypassLockdown: hasResolvedPermission(context.authorization, PERMISSIONS.BUG_PANEL) });
  if (!lockdown.allowed) return responseError(lockdown.error, 403);
  try {
    const result = await deleteComment({
      commentId: context.commentId,
      actorUserId: context.user.id,
      canManage,
    });
    if (result.error) return responseError(result.error, result.status ?? 400);
    await createAuditLog({
      type: "comment_action",
      action: "bug_comment.deleted",
      actorUserId: context.user.id,
      targetUserId: result.before.creatorUserId,
      summary: `${context.user.username} deleted a comment on ${context.publicId}.`,
      beforeData: result.before,
      metadata: { publicId: context.publicId, commentId: context.commentId },
    });
    return NextResponse.json({ deleted: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    console.error("Failed to delete bug comment", cause);
    return responseError("Failed to delete comment.", 500);
  }
}
