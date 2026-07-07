import mysql from "mysql2/promise";

const poolGlobalKey = Symbol.for("vanillasquared.mysql.pool");
const initializedGlobalKey = Symbol.for("vanillasquared.mysql.initialized");

const BUILT_IN_ROLE_PERMISSIONS = Object.freeze({
  default: [],
  support: ["bug_panel"],
  developer: ["design_test", "dev_options"],
  owner: ["bug_panel", "design_test", "dev_options", "user_management", "manage_roles", "delete_user", "manage_user"],
});

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

        await seedBuiltInRoles();
        await assignBuiltInRoles();

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
  for (const [role, permissions] of Object.entries(BUILT_IN_ROLE_PERMISSIONS)) {
    await getPool().execute("INSERT IGNORE INTO roles (name) VALUES (?)", [role]);
    for (const permission of permissions) {
      await getPool().execute("INSERT IGNORE INTO role_permissions (role, permission) VALUES (?, ?)", [role, permission]);
    }
  }
}

async function assignBuiltInRoles() {
  await getPool().execute(
    "INSERT IGNORE INTO user_roles (user_id, role) SELECT id, ? FROM users WHERE LOWER(username) = ?",
    ["owner", "painterflow11"]
  );
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
  await getPool().execute("INSERT INTO users (id, username, email) VALUES (?, ?, ?)", [id, username, email]);
  await assignBuiltInRoles();
  return getUserById(id);
}

export async function updateUser(userId, { username, email }) {
  await initializeUsersTable();
  await getPool().execute("UPDATE users SET username = ?, email = ? WHERE id = ?", [username, email, userId]);
  await assignBuiltInRoles();
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
  const [rows] = await getPool().execute("SELECT * FROM roles ORDER BY name");
  return rows.map(parseRole);
}

export async function getRole(name) {
  await initializeUsersTable();
  const [rows] = await getPool().execute("SELECT * FROM roles WHERE name = ? LIMIT 1", [name]);
  return parseRole(rows[0]);
}

export async function createRole(name, permissions = []) {
  await initializeUsersTable();
  await getPool().execute("INSERT INTO roles (name) VALUES (?)", [name]);
  await setRolePermissions(name, permissions);
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

export async function deleteRole(role) {
  await initializeUsersTable();
  await getPool().execute("DELETE FROM user_roles WHERE role = ?", [role]);
  await getPool().execute("DELETE FROM roles WHERE name = ?", [role]);
}

export async function getRolePermissions(role) {
  await initializeUsersTable();
  const [rows] = await getPool().execute("SELECT permission FROM role_permissions WHERE role = ? ORDER BY permission", [role]);
  return rows.map((row) => row.permission);
}

export async function getPermissionsForRolesFromDb(roles = []) {
  const cleanRoles = roles.filter(Boolean);
  if (!cleanRoles.length) return [];
  await initializeUsersTable();
  const placeholders = cleanRoles.map(() => "?").join(", ");
  const [rows] = await getPool().execute(
    `SELECT DISTINCT permission FROM role_permissions WHERE role IN (${placeholders}) ORDER BY permission`,
    cleanRoles
  );
  return rows.map((row) => row.permission);
}

export async function setRolePermissions(role, permissions = []) {
  await initializeUsersTable();
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute("DELETE FROM role_permissions WHERE role = ?", [role]);
    for (const permission of [...new Set(permissions)]) {
      await connection.execute("INSERT INTO role_permissions (role, permission) VALUES (?, ?)", [role, permission]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
