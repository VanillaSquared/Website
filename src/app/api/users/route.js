import { NextResponse } from "next/server";

import { getAuthorizationForUser, PERMISSIONS } from "@/auth/permissions";
import { listUsers } from "@/auth/openSQL";
import { canManageUserByHierarchy, jsonError, requireApiPermission } from "@/auth/userManagement";
import { guardSameOriginRequest } from "@/security/requestGuards";

export const dynamic = "force-dynamic";

function viewerActions(authorization) {
  return {
    canManageRoles: Boolean(authorization.permissionMap?.[PERMISSIONS.MANAGE_ROLES]),
    canManageUser: Boolean(authorization.permissionMap?.[PERMISSIONS.MANAGE_USER]),
    canDeleteUser: Boolean(authorization.permissionMap?.[PERMISSIONS.DELETE_USER]),
  };
}

export async function GET() {
  const auth = await requireApiPermission(PERMISSIONS.USER_MANAGEMENT);
  if (auth.error) return auth.error;

  const viewerAuthorization = await getAuthorizationForUser(auth.user);
  const actions = viewerActions(viewerAuthorization);
  const users = await listUsers();
  const usersWithAuthorization = await Promise.all(users.map(async (user) => ({
    ...user,
    isProtected: !await canManageUserByHierarchy(auth.user, user),
    authorization: await getAuthorizationForUser(user),
    actions,
  })));

  return NextResponse.json({ users: usersWithAuthorization, viewer: { authorization: viewerAuthorization, actions } }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;

  return jsonError("Use /api/users/[userId] to update a user.", 404);
}

export async function DELETE(request) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;

  return jsonError("Use /api/users/[userId] to delete a user.", 404);
}
