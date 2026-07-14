import mysql from "mysql2/promise";

const poolGlobalKey = Symbol.for("vanillasquared.mysql.pool");
const initializedGlobalKey = Symbol.for("vanillasquared.mysql.initialized");

const BUILT_IN_ROLE_PERMISSIONS = Object.freeze({
  owner: ["bug_panel", "design_test", "dev_options", "user_management", "audit_log", "manage_roles", "delete_user", "manage_user", "create_bugs", "view_bugs", "edit_bugs", "manage_bugs", "write_comments", "manage_comments", "bypass_limits"],
  developer: ["design_test", "dev_options", "bypass_limits", "audit_log"],
  support: ["bug_panel", "manage_bugs", "manage_comments", "bypass_limits", "audit_log"],
  default: ["create_bugs", "view_bugs", "edit_bugs", "write_comments"],
  not_signed_in: ["view_bugs"],
});

const BUILT_IN_ROLE_COLORS = Object.freeze({
  owner: "#e20d3f",
  developer: "#8a15db",
  support: "#00a4e5",
  default: "#9ca3af",
  not_signed_in: "#6b7280",
});

const LEGACY_BUILT_IN_ROLE_COLORS = Object.freeze({
  owner: "#f59e0b",
  developer: "#a855f7",
  support: "#3b82f6",
});

const LEGACY_BUILT_IN_ROLE_NAMES = Object.freeze(["default", "not_signed_in", "support", "developer", "owner"]);

let pool = globalThis[poolGlobalKey];
let initialized = globalThis[initializedGlobalKey];

function getDatabaseUrlConfig() {
  if (!process.env.DATABASE_URL) {
    return undefined;
  }

  return { uri: process.env.DATABASE_URL };
}

function getPoolConfig() {
  return (
    getDatabaseUrlConfig() ?? {
      host: process.env.MYSQL_HOST ?? "localhost",
      port: Number(process.env.MYSQL_PORT ?? 3306),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    }
  );
}

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      ...getPoolConfig(),
      connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT ?? 3),
      waitForConnections: true,
      queueLimit: 0,
      namedPlaceholders: true,
    });
    globalThis[poolGlobalKey] = pool;
  }

  return pool;
}

export async function initializeUsersTable() {
  if (!initialized) {
    initialized = (async () => {
      try {
        await getPool().query(`
          CREATE TABLE IF NOT EXISTS users (
            id CHAR(36) PRIMARY KEY,
            username VARCHAR(32) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);

        await getPool().query(`
          CREATE TABLE IF NOT EXISTS roles (
            name VARCHAR(64) PRIMARY KEY,
            hierarchy_order INT NULL,
            color CHAR(7) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);

        await getPool().query(`
          CREATE TABLE IF NOT EXISTS role_permissions (
            role VARCHAR(64) NOT NULL,
            permission VARCHAR(64) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (role, permission),
            CONSTRAINT role_permissions_role_fk FOREIGN KEY (role) REFERENCES roles(name) ON DELETE CASCADE ON UPDATE CASCADE
          )
        `);

        await getPool().query(`
          CREATE TABLE IF NOT EXISTS role_inclusions (
            role VARCHAR(64) NOT NULL,
            included_role VARCHAR(64) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (role, included_role),
            CONSTRAINT role_inclusions_role_fk FOREIGN KEY (role) REFERENCES roles(name) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT role_inclusions_included_role_fk FOREIGN KEY (included_role) REFERENCES roles(name) ON DELETE CASCADE ON UPDATE CASCADE
          )
        `);

        await getPool().query(`
          CREATE TABLE IF NOT EXISTS user_roles (
            user_id CHAR(36) NOT NULL,
            role VARCHAR(64) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, role),
            CONSTRAINT user_roles_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);

        await getPool().query(`
          CREATE TABLE IF NOT EXISTS user_permissions (
            user_id CHAR(36) NOT NULL,
            permission VARCHAR(64) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, permission),
            CONSTRAINT user_permissions_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);

        try {
          await getPool().query("ALTER TABLE roles ADD COLUMN hierarchy_order INT NULL");
        } catch {
          // Older installs that already have this column do not need migration.
        }

        try {
          await getPool().query("ALTER TABLE roles ADD COLUMN color CHAR(7) NULL");
        } catch {
          // Older installs that already have this column do not need migration.
        }

        await seedBuiltInRoles();
        await assignFirstUserOwnerRole();

        try {
          await getPool().query("ALTER TABLE users MODIFY password_hash JSON NULL");
        } catch {
          // Older installs may not have this legacy password column, which is fine.
        }
      } catch (error) {
        initialized = undefined;
        globalThis[initializedGlobalKey] = undefined;
        throw error;
      }
    })();
    globalThis[initializedGlobalKey] = initialized;
  }

  await initialized;
}

async function seedBuiltInRoles() {
  const roleNames = Object.keys(BUILT_IN_ROLE_PERMISSIONS);
  for (const [index, role] of roleNames.entries()) {
    const permissions = BUILT_IN_ROLE_PERMISSIONS[role];
    await getPool().execute("INSERT IGNORE INTO roles (name, hierarchy_order) VALUES (?, ?)", [role, index]);
    await getPool().execute("UPDATE roles SET hierarchy_order = ? WHERE name = ? AND hierarchy_order IS NULL", [index, role]);
    await getPool().execute("UPDATE roles SET color = ? WHERE name = ? AND color IS NULL", [BUILT_IN_ROLE_COLORS[role], role]);
    for (const permission of permissions) {
      await getPool().execute("INSERT IGNORE INTO role_permissions (role, permission) VALUES (?, ?)", [role, permission]);
    }
  }
  const [unrankedRoles] = await getPool().execute("SELECT name FROM roles WHERE hierarchy_order IS NULL ORDER BY name");
  for (const [offset, row] of unrankedRoles.entries()) {
    await getPool().execute("UPDATE roles SET hierarchy_order = ? WHERE name = ?", [roleNames.length + offset, row.name]);
  }
  await Promise.all(Object.entries(LEGACY_BUILT_IN_ROLE_COLORS).map(([role, legacyColor]) => (
    getPool().execute("UPDATE roles SET color = ? WHERE name = ? AND color = ?", [BUILT_IN_ROLE_COLORS[role], role, legacyColor])
  )));
  await migrateLegacyBuiltInRoleHierarchy();
}

async function migrateLegacyBuiltInRoleHierarchy() {
  const placeholders = LEGACY_BUILT_IN_ROLE_NAMES.map(() => "?").join(", ");
  const [legacyRoles] = await getPool().execute(
    `SELECT name, hierarchy_order FROM roles WHERE name IN (${placeholders})`,
    LEGACY_BUILT_IN_ROLE_NAMES
  );
  const roleOrders = new Map(legacyRoles.map((role) => [role.name, Number(role.hierarchy_order)]));
  const baseRoleOrders = new Set([roleOrders.get("default"), roleOrders.get("not_signed_in")]);
  const isLegacyHierarchy = roleOrders.get("owner") === 4
    && roleOrders.get("developer") === 3
    && roleOrders.get("support") === 2
    && baseRoleOrders.size === 2
    && baseRoleOrders.has(0)
    && baseRoleOrders.has(1);
  if (!isLegacyHierarchy) return;

  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    for (const [index, role] of Object.keys(BUILT_IN_ROLE_PERMISSIONS).entries()) {
      await connection.execute("UPDATE roles SET hierarchy_order = ? WHERE name = ?", [index, role]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function assignFirstUserOwnerRole() {
  const [owners] = await getPool().execute("SELECT 1 FROM user_roles WHERE role = ? LIMIT 1", ["owner"]);
  if (owners.length) return;

  const [users] = await getPool().execute("SELECT id FROM users ORDER BY created_at ASC, id ASC LIMIT 1");
  const firstUserId = users[0]?.id;
  if (!firstUserId) return;

  await getPool().execute("INSERT IGNORE INTO user_roles (user_id, role) VALUES (?, ?)", [firstUserId, "owner"]);
}

function parseUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseRole(row) {
  if (!row) return null;
  return {
    name: row.name,
    hierarchyOrder: Number(row.hierarchy_order ?? 0),
    color: row.color ?? "#c269c2",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function selectOne(sql, params) {
  await initializeUsersTable();
  const [rows] = await getPool().execute(sql, params);
  return parseUser(rows[0]);
}

export async function getUserById(id) {
  return selectOne("SELECT * FROM users WHERE id = ? LIMIT 1", [id]);
}

export async function getUserByUsername(username) {
  return selectOne("SELECT * FROM users WHERE username = ? LIMIT 1", [username]);
}

export async function getUserByEmail(email) {
  return selectOne("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
}

export async function getUserByUsernameAndEmail(username, email) {
  return selectOne("SELECT * FROM users WHERE username = ? AND email = ? LIMIT 1", [username, email]);
}

export async function createUser({ id, username, email }) {
  await initializeUsersTable();
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const [countRows] = await connection.execute("SELECT COUNT(*) AS user_count FROM users FOR UPDATE");
    const isFirstUser = Number(countRows[0]?.user_count ?? 0) === 0;
    await connection.execute("INSERT INTO users (id, username, email) VALUES (?, ?, ?)", [id, username, email]);
    if (isFirstUser) {
      await connection.execute("INSERT IGNORE INTO user_roles (user_id, role) VALUES (?, ?)", [id, "owner"]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  await assignFirstUserOwnerRole();
  return getUserById(id);
}

export async function updateUser(userId, { username, email }) {
  await initializeUsersTable();
  await getPool().execute("UPDATE users SET username = ?, email = ? WHERE id = ?", [username, email, userId]);
  await assignFirstUserOwnerRole();
  return getUserById(userId);
}

export async function deleteUser(userId) {
  await initializeUsersTable();
  await getPool().execute("DELETE FROM users WHERE id = ?", [userId]);
}

export async function listUsers() {
  await initializeUsersTable();
  const [rows] = await getPool().execute("SELECT * FROM users ORDER BY username");
  return rows.map(parseUser);
}

export async function getUserRolesByUserId(userId) {
  if (!userId) return [];
  await initializeUsersTable();
  const [rows] = await getPool().execute("SELECT role FROM user_roles WHERE user_id = ? ORDER BY role", [userId]);
  return rows.map((row) => row.role);
}

export async function getUserPermissionsByUserId(userId) {
  if (!userId) return [];
  await initializeUsersTable();
  const [rows] = await getPool().execute("SELECT permission FROM user_permissions WHERE user_id = ? ORDER BY permission", [userId]);
  return rows.map((row) => row.permission);
}

export async function addUserRole(userId, role) {
  await initializeUsersTable();
  await getPool().execute("INSERT IGNORE INTO user_roles (user_id, role) VALUES (?, ?)", [userId, role]);
}

export async function removeUserRole(userId, role) {
  await initializeUsersTable();
  await getPool().execute("DELETE FROM user_roles WHERE user_id = ? AND role = ?", [userId, role]);
}

export async function addUserPermission(userId, permission) {
  await initializeUsersTable();
  await getPool().execute("INSERT IGNORE INTO user_permissions (user_id, permission) VALUES (?, ?)", [userId, permission]);
}

export async function removeUserPermission(userId, permission) {
  await initializeUsersTable();
  await getPool().execute("DELETE FROM user_permissions WHERE user_id = ? AND permission = ?", [userId, permission]);
}

export async function listRoles() {
  await initializeUsersTable();
  await seedBuiltInRoles();
  const [rows] = await getPool().execute("SELECT * FROM roles ORDER BY hierarchy_order, name");
  return rows.map(parseRole);
}

export async function getRole(name) {
  await initializeUsersTable();
  await seedBuiltInRoles();
  const [rows] = await getPool().execute("SELECT * FROM roles WHERE name = ? LIMIT 1", [name]);
  return parseRole(rows[0]);
}

export async function createRole(name, permissions = [], color = "#c269c2", includedRoles = []) {
  await initializeUsersTable();
  const [rows] = await getPool().execute("SELECT COALESCE(MAX(hierarchy_order), -1) + 1 AS next_order FROM roles");
  await getPool().execute("INSERT INTO roles (name, hierarchy_order, color) VALUES (?, ?, ?)", [name, Number(rows[0]?.next_order ?? 0), color]);
  await setRoleAuthorization(name, permissions, includedRoles);
  return getRole(name);
}

export async function renameRole(role, name) {
  await initializeUsersTable();
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute("UPDATE roles SET name = ? WHERE name = ?", [name, role]);
    await connection.execute("UPDATE user_roles SET role = ? WHERE role = ?", [name, role]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return getRole(name);
}

export async function setRoleColor(role, color) {
  await initializeUsersTable();
  await getPool().execute("UPDATE roles SET color = ? WHERE name = ?", [color, role]);
  return getRole(role);
}

export async function deleteRole(role) {
  await initializeUsersTable();
  await getPool().execute("DELETE FROM user_roles WHERE role = ?", [role]);
  await getPool().execute("DELETE FROM roles WHERE name = ?", [role]);
}

export async function reorderRoles(roleNames = []) {
  await initializeUsersTable();
  const existingRoles = await listRoles();
  const existingNames = existingRoles.map((role) => role.name);
  if (roleNames.length !== existingNames.length || new Set(roleNames).size !== roleNames.length || !roleNames.every((role) => existingNames.includes(role))) {
    const error = new Error("Role hierarchy must include every role exactly once.");
    error.status = 400;
    throw error;
  }

  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    for (const [index, role] of roleNames.entries()) {
      await connection.execute("UPDATE roles SET hierarchy_order = ? WHERE name = ?", [index, role]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getRolePermissions(role) {
  await initializeUsersTable();
  const [rows] = await getPool().execute("SELECT permission FROM role_permissions WHERE role = ? ORDER BY permission", [role]);
  return rows.map((row) => row.permission);
}

export async function getRoleIncludedRoles(role) {
  await initializeUsersTable();
  const [rows] = await getPool().execute("SELECT included_role FROM role_inclusions WHERE role = ? ORDER BY included_role", [role]);
  return rows.map((row) => row.included_role);
}

export async function getPermissionsForRolesFromDb(roles = []) {
  const pendingRoles = [...new Set(roles.filter(Boolean))];
  if (!pendingRoles.length) return [];
  await initializeUsersTable();

  const visitedRoles = new Set();
  const permissions = new Set();
  while (pendingRoles.length) {
    const role = pendingRoles.shift();
    if (visitedRoles.has(role)) continue;
    visitedRoles.add(role);
    const [permissionRows, inclusionRows] = await Promise.all([
      getPool().execute("SELECT permission FROM role_permissions WHERE role = ?", [role]),
      getPool().execute("SELECT included_role FROM role_inclusions WHERE role = ?", [role]),
    ]);
    permissionRows[0].forEach((row) => permissions.add(row.permission));
    inclusionRows[0].forEach((row) => {
      if (!visitedRoles.has(row.included_role)) pendingRoles.push(row.included_role);
    });
  }
  return [...permissions].sort();
}

export async function wouldCreateRoleInclusionCycle(role, includedRoles = []) {
  const pendingRoles = [...new Set(includedRoles)];
  const visitedRoles = new Set();
  while (pendingRoles.length) {
    const nextRole = pendingRoles.shift();
    if (nextRole === role) return true;
    if (visitedRoles.has(nextRole)) continue;
    visitedRoles.add(nextRole);
    pendingRoles.push(...await getRoleIncludedRoles(nextRole));
  }
  return false;
}

export async function setRoleAuthorization(role, permissions = [], includedRoles = []) {
  await initializeUsersTable();
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute("DELETE FROM role_permissions WHERE role = ?", [role]);
    await connection.execute("DELETE FROM role_inclusions WHERE role = ?", [role]);
    for (const permission of [...new Set(permissions)]) {
      await connection.execute("INSERT INTO role_permissions (role, permission) VALUES (?, ?)", [role, permission]);
    }
    for (const includedRole of [...new Set(includedRoles)]) {
      await connection.execute("INSERT INTO role_inclusions (role, included_role) VALUES (?, ?)", [role, includedRole]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function setRolePermissions(role, permissions = []) {
  return setRoleAuthorization(role, permissions, await getRoleIncludedRoles(role));
}
