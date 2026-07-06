import mysql from "mysql2/promise";

const poolGlobalKey = Symbol.for("vanillasquared.mysql.pool");
const initializedGlobalKey = Symbol.for("vanillasquared.mysql.initialized");

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
          CREATE TABLE IF NOT EXISTS user_roles (
            user_id CHAR(36) NOT NULL,
            role VARCHAR(64) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, role),
            CONSTRAINT user_roles_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);

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

async function assignBuiltInRoles() {
  await getPool().execute(
    "INSERT IGNORE INTO user_roles (user_id, role) SELECT id, ? FROM users WHERE LOWER(username) = ?",
    ["developer", "painterflow11"]
  );
}

function parseUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    email: row.email,
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

export async function getUserRolesByUserId(userId) {
  if (!userId) {
    return [];
  }

  await initializeUsersTable();

  const [rows] = await getPool().execute(
    "SELECT role FROM user_roles WHERE user_id = ? ORDER BY role",
    [userId]
  );

  return rows.map((row) => row.role);
}
