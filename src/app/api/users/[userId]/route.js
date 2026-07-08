import { NextResponse } from "next/server";

import { createAuditLog } from "@/audit/logs";
import { deleteUser, getUserByEmail, getUserByUsername, updateUser } from "@/auth/openSQL";
import { getAuthorizationForUser, PERMISSIONS } from "@/auth/permissions";
import { getMutableTargetUser, jsonError, requireApiPermission } from "@/auth/userManagement";
import { guardSameOriginRequest } from "@/security/requestGuards";

function validateUserInput(body) {
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) return { error: "Username must be 3-32 characters and use letters, numbers, or underscores." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) return { error: "Invalid email." };

  return { username, email };
}

export async function PATCH(request, { params }) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;

  const auth = await requireApiPermission(PERMISSIONS.MANAGE_USER);
  if (auth.error) return auth.error;

  const { userId } = await params;
  const target = await getMutableTargetUser(userId);
  if (target.error) return target.error;

  const input = validateUserInput(await request.json().catch(() => ({})));
  if (input.error) return jsonError(input.error, 400);

  const existingUsername = await getUserByUsername(input.username);
  if (existingUsername && existingUsername.id !== userId) return jsonError("Username is already in use.", 409);

  const existingEmail = await getUserByEmail(input.email);
  if (existingEmail && existingEmail.id !== userId) return jsonError("Email is already in use.", 409);

  const beforeData = { id: target.user.id, username: target.user.username, email: target.user.email };
  const user = await updateUser(userId, input);
  await createAuditLog({
    type: "user_management",
    action: "user.updated",
    actorUserId: auth.user.id,
    targetUserId: userId,
    summary: `${auth.user.username} updated ${user.username}'s account details.`,
    beforeData,
    afterData: { id: user.id, username: user.username, email: user.email },
  });
  return NextResponse.json({ user, authorization: await getAuthorizationForUser(user) }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request, { params }) {
  const blocked = guardSameOriginRequest(request);
  if (blocked) return blocked;

  const auth = await requireApiPermission(PERMISSIONS.DELETE_USER);
  if (auth.error) return auth.error;

  const { userId } = await params;
  const target = await getMutableTargetUser(userId);
  if (target.error) return target.error;

  await createAuditLog({
    type: "user_management",
    action: "user.deleted",
    actorUserId: auth.user.id,
    targetUserId: userId,
    summary: `${auth.user.username} deleted ${target.user.username}.`,
    beforeData: { id: target.user.id, username: target.user.username, email: target.user.email },
  });
  await deleteUser(userId);
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
