import "server-only";

import {
  getPermissionsForRolesFromDb,
  getUserPermissionsByUserId,
  getUserRolesByUserId,
  listRoles,
} from "@/auth/openSQL";

export const PERMISSIONS = Object.freeze({
  BUG_PANEL: "bug_panel",
  DESIGN_TEST: "design_test",
  DEV_OPTIONS: "dev_options",
  USER_MANAGEMENT: "user_management",
  MANAGE_ROLES: "manage_roles",
  DELETE_USER: "delete_user",
  MANAGE_USER: "manage_user",
  CREATE_BUGS: "create_bugs",
  VIEW_BUGS: "view_bugs",
});

export const PERMISSION_VALUES = Object.freeze(Object.values(PERMISSIONS));
export const DEFAULT_ROLE = "default";
export const NOT_SIGNED_IN_ROLE = "not_signed_in";

export function isValidRoleName(role) {
  return typeof role === "string" && /^[a-z0-9_-]{1,64}$/i.test(role);
}

export async function isValidRole(role) {
  if (!isValidRoleName(role)) return false;
  return Boolean((await listRoles()).some((item) => item.name === role));
}

export function isValidPermission(permission) {
  return PERMISSION_VALUES.includes(permission);
}

export async function getPermissionsForRoles(roles = []) {
  return (await getPermissionsForRolesFromDb(roles.filter(isValidRoleName))).filter(isValidPermission).sort();
}

export function hasResolvedPermission(authorization, permission) {
  return Boolean(authorization?.permissions?.includes(permission));
}

export async function getAuthorizationForUser(user) {
  const [roles, individualPermissions] = user?.id
    ? await Promise.all([
      getUserRolesByUserId(user.id),
      getUserPermissionsByUserId(user.id),
    ])
    : [[NOT_SIGNED_IN_ROLE], []];

  const validRoles = roles.filter(isValidRoleName);
  const resolvedRoles = user?.id && !validRoles.length ? [DEFAULT_ROLE] : validRoles;
  const validIndividualPermissions = individualPermissions.filter(isValidPermission);
  const rolePermissions = await getPermissionsForRoles(resolvedRoles);
  const permissions = [...new Set([...rolePermissions, ...validIndividualPermissions])].sort();
  const permissionMap = Object.fromEntries(PERMISSION_VALUES.map((permission) => [permission, permissions.includes(permission)]));

  return {
    roles: resolvedRoles,
    rolePermissions,
    individualPermissions: validIndividualPermissions,
    permissions,
    permissionMap,
    canViewStaffSettings: permissions.length > 0,
  };
}

export async function hasPermission(user, permission) {
  if (!isValidPermission(permission)) {
    return false;
  }

  return hasResolvedPermission(await getAuthorizationForUser(user), permission);
}

export async function requirePermission(user, permission) {
  if (!await hasPermission(user, permission)) {
    const error = new Error("Forbidden");
    error.status = 403;
    throw error;
  }
}

export async function getUserPermissions(user) {
  return getAuthorizationForUser(user);
}
