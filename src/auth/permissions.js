import "server-only";

import { getUserRolesByUserId } from "@/auth/openSQL";

export const PERMISSIONS = {
  STAFF_SETTINGS: "staff:settings",
};

export async function getUserRoles(user) {
  return getUserRolesByUserId(user?.id);
}

export async function getUserPermissions(user) {
  const roles = await getUserRoles(user);
  const canViewStaffSettings = roles.includes("developer");

  return {
    roles,
    canViewStaffSettings,
    permissions: canViewStaffSettings ? [PERMISSIONS.STAFF_SETTINGS] : [],
  };
}
