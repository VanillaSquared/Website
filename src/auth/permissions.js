import "server-only";

export const PERMISSIONS = {
  STAFF_SETTINGS: "staff:settings",
};

function getDeveloperIdentifiers() {
  return new Set(
    String(process.env.DEVELOPER_USERS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function getUserRoles(user) {
  const developers = getDeveloperIdentifiers();
  const identifiers = [user?.id, user?.username, user?.email]
    .map((value) => String(value ?? "").trim().toLowerCase())
    .filter(Boolean);

  return identifiers.some((identifier) => developers.has(identifier)) ? ["developer"] : [];
}

export function getUserPermissions(user) {
  const roles = getUserRoles(user);

  return {
    roles,
    canViewStaffSettings: roles.includes("developer"),
    permissions: roles.includes("developer") ? [PERMISSIONS.STAFF_SETTINGS] : [],
  };
}
