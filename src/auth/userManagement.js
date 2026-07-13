import "server-only";

import { NextResponse } from "next/server";

import { getAuthSubject } from "@/app/auth";
import { getRole, getUserById, getUserRolesByUserId, listRoles } from "@/auth/openSQL";
import { DEFAULT_ROLE, hasPermission } from "@/auth/permissions";

async function getHighestRoleOrder(user) {
  if (!user?.id) return Number.POSITIVE_INFINITY;

  const [roles, assignedRoles] = await Promise.all([listRoles(), getUserRolesByUserId(user.id)]);
  const roleOrders = new Map(roles.map((role) => [role.name, role.hierarchyOrder]));
  const effectiveRoles = assignedRoles.length ? assignedRoles : [DEFAULT_ROLE];
  const orders = effectiveRoles.map((role) => roleOrders.get(role)).filter(Number.isFinite);
  return orders.length ? Math.min(...orders) : Number.POSITIVE_INFINITY;
}

export async function canManageUserByHierarchy(actor, target) {
  if (!actor?.id || !target?.id || actor.id === target.id) return false;
  const [actorOrder, targetOrder] = await Promise.all([getHighestRoleOrder(actor), getHighestRoleOrder(target)]);
  return actorOrder < targetOrder;
}

export async function canManageRoleByHierarchy(actor, roleName) {
  const [actorOrder, role] = await Promise.all([getHighestRoleOrder(actor), getRole(roleName)]);
  return Boolean(role && actorOrder < role.hierarchyOrder);
}

export async function validateRoleHierarchyChange(actor, roleNames) {
  const [actorOrder, existingRoles] = await Promise.all([getHighestRoleOrder(actor), listRoles()]);
  if (!Number.isFinite(actorOrder)) return false;

  const lockedRoleNames = existingRoles
    .filter((role) => role.hierarchyOrder <= actorOrder)
    .map((role) => role.name);
  return lockedRoleNames.every((roleName, index) => roleNames[index] === roleName);
}

export function jsonError(message, status) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function requireApiPermission(permission) {
  const subject = await getAuthSubject({ updateTokens: false });
  const user = subject ? subject.properties : null;

  if (!user) return { error: jsonError("Unauthorized", 401) };
  if (!await hasPermission(user, permission)) return { error: jsonError("Forbidden", 403) };

  return { user };
}

export async function getMutableTargetUser(userId, actor) {
  const user = await getUserById(userId);
  if (!user) return { error: jsonError("Not found", 404) };
  if (!await canManageUserByHierarchy(actor, user)) {
    return { error: jsonError("You cannot act on users at or above your highest role.", 403) };
  }
  return { user };
}

export async function getMutableTargetRole(roleName, actor) {
  const role = await getRole(roleName);
  if (!role) return { error: jsonError("Role not found.", 404) };
  if (!await canManageRoleByHierarchy(actor, roleName)) {
    return { error: jsonError("You cannot manage roles at or above your highest role.", 403) };
  }
  return { role };
}

export function normalizeRoleName(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizePermissionList(value, isValidPermission) {
  return Array.isArray(value) ? [...new Set(value)].filter(isValidPermission).sort() : [];
}
