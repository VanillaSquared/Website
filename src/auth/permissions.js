import "server-only";

import {
  getUserPermissionsByUserId,
  getUserRolesByUserId,
} from "@/auth/openSQL";

export const PERMISSIONS = Object.freeze({
  BUG_PANEL: "bug_panel",
  DESIGN_TEST: "design_test",
  DEV_OPTIONS: "dev_options",
  USER_MANAGEMENT: "user_management",
});

export const ROLE_PERMISSIONS = Object.freeze({
  default: [],
  support: [PERMISSIONS.BUG_PANEL],
  developer: [PERMISSIONS.DESIGN_TEST, PERMISSIONS.DEV_OPTIONS],
  owner: Object.values(PERMISSIONS),
});

export const ROLES = Object.freeze(Object.keys(ROLE_PERMISSIONS));
export const PERMISSION_VALUES = Object.freeze(Object.values(PERMISSIONS));

export function isValidRole(role) {
  return ROLES.includes(role);
}

export function isValidPermission(permission) {
  return PERMISSION_VALUES.includes(permission);
}

export function getPermissionsForRoles(roles = []) {
  return [...new Set(roles.flatMap((role) => ROLE_PERMISSIONS[role] ?? []))].sort();
}

export function hasResolvedPermission(authorization, permission) {
  return Boolean(authorization?.permissions?.includes(permission));
}

export async function getAuthorizationForUser(user) {
  if (!user?.id) {
    return {
      roles: [],
      rolePermissions: [],
      individualPermissions: [],
      permissions: [],
      permissionMap: Object.fromEntries(PERMISSION_VALUES.map((permission) => [permission, false])),
      canViewStaffSettings: false,
    };
  }

  const [roles, individualPermissions] = await Promise.all([
    getUserRolesByUserId(user.id),
    getUserPermissionsByUserId(user.id),
  ]);
  const validRoles = roles.filter(isValidRole);
  const validIndividualPermissions = individualPermissions.filter(isValidPermission);
  const rolePermissions = getPermissionsForRoles(validRoles);
  const permissions = [...new Set([...rolePermissions, ...validIndividualPermissions])].sort();
  const permissionMap = Object.fromEntries(PERMISSION_VALUES.map((permission) => [permission, permissions.includes(permission)]));

  return {
    roles: validRoles,
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
