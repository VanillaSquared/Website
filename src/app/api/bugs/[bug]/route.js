import { NextResponse } from "next/server";

import { getAuthSubject } from "@/app/auth";
import { createAuditLog } from "@/audit/logs";
import { PERMISSIONS, getAuthorizationForUser, hasResolvedPermission } from "@/auth/permissions";
import { checkLockdownAllowed } from "@/bugs/limits";
import { deleteBugReport, updateBugCommentsSetting, updateBugLockSetting, updateBugReport } from "@/bugs/reporter";
import { guardSameOriginRequest } from "@/security/requestGuards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function errorResponse(error, status) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

function getBugId(value) {
  try {
    const bugId = decodeURIComponent(value);
    return /^[a-z0-9-]{3,32}$/i.test(bugId) ? bugId : null;
  } catch {
    return null;
  }
}

async function getRequestContext() {
  const subject = await getAuthSubject();
  const user = subject?.properties;
  if (!user?.id) return { error: errorResponse("You must be logged in.", 401) };
  return { user, authorization: await getAuthorizationForUser(user) };
}

export async function PATCH(request, { params }) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;

  const context = await getRequestContext();
  if (context.error) return context.error;
  const canManage = hasResolvedPermission(context.authorization, PERMISSIONS.MANAGE_BUGS);
  const canUseBugPanel = hasResolvedPermission(context.authorization, PERMISSIONS.BUG_PANEL);
  const canSupport = canUseBugPanel;
  const canEditFields = canManage || canUseBugPanel || hasResolvedPermission(context.authorization, PERMISSIONS.EDIT_BUGS);
  const canToggleAny = canSupport;
  const lockdown = await checkLockdownAllowed({ bypassLockdown: canUseBugPanel });
  if (!lockdown.allowed) return errorResponse(lockdown.error, 403);
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  try {
    const { bug } = await params;
    const publicId = getBugId(bug);
    if (!publicId) return errorResponse("Choose a valid bug report ID.", 400);

    let result;
    if (contentType.startsWith("application/json")) {
      const body = await request.json().catch(() => ({}));
      const keys = Object.keys(body);
      if (keys.length !== 1 || !["allowComments", "locked"].includes(keys[0])) {
        return errorResponse("Choose one valid bug report setting.", 400);
      }
      result = keys[0] === "locked"
        ? await updateBugLockSetting({ publicId, canLock: canSupport, locked: body.locked })
        : await updateBugCommentsSetting({
          publicId,
          actorUserId: context.user.id,
          canToggleAny,
          allowComments: body.allowComments,
        });
    } else {
      if (!canEditFields) return errorResponse("Forbidden", 403);
      if (!contentType.startsWith("multipart/form-data")) {
        return errorResponse("Submit the report as multipart form data.", 400);
      }
      let formData;
      try {
        formData = await request.formData();
      } catch {
        return errorResponse("Submit valid multipart form data.", 400);
      }
      result = await updateBugReport({
        publicId,
        actorUserId: context.user.id,
        canManage,
        canEditAny: canUseBugPanel,
        canEditState: canUseBugPanel,
        bypassLockdown: canUseBugPanel,
        bypassReportLock: canSupport,
        formData,
      });
    }
    if (result.error) return errorResponse(result.error, result.status ?? 400);

    await createAuditLog({
      type: "bug_reporter_action",
      action: "bug_report.updated",
      actorUserId: context.user.id,
      targetUserId: result.after.creatorUserId,
      summary: `${context.user.username} updated bug report ${result.before.publicId}.`,
      beforeData: result.before,
      afterData: result.after,
      metadata: { previousPublicId: result.before.publicId, publicId: result.publicId },
    });

    return NextResponse.json({ id: result.id, publicId: result.publicId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to update bug report", error);
    return errorResponse("Failed to update bug report.", 500);
  }
}

export async function DELETE(request, { params }) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;

  const context = await getRequestContext();
  if (context.error) return context.error;
  const canManage = hasResolvedPermission(context.authorization, PERMISSIONS.MANAGE_BUGS);
  if (!canManage) return errorResponse("Forbidden", 403);

  try {
    const { bug } = await params;
    const publicId = getBugId(bug);
    if (!publicId) return errorResponse("Choose a valid bug report ID.", 400);
    const result = await deleteBugReport({
      publicId,
      actorUserId: context.user.id,
      canManage,
    });
    if (result.error) return errorResponse(result.error, result.status ?? 400);

    await createAuditLog({
      type: "bug_reporter_action",
      action: "bug_report.deleted",
      actorUserId: context.user.id,
      targetUserId: result.creatorUserId,
      summary: `${context.user.username} deleted bug report ${result.publicId}.`,
      beforeData: result.before,
      afterData: null,
      metadata: { publicId: result.publicId },
    });

    return NextResponse.json({ deleted: true, publicId: result.publicId }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to delete bug report", error);
    return errorResponse("Failed to delete bug report.", 500);
  }
}
