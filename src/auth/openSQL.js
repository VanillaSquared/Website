import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import mysql from "mysql2/promise";

let pool;
let initialized;
let fileWrite = Promise.resolve();

const localDataPath = path.join(process.cwd(), ".data", "users.json");

function hasMysqlConfig() {
  return Boolean(
    process.env.DATABASE_URL ||
      process.env.MYSQL_HOST ||
      process.env.MYSQL_USER ||
      process.env.MYSQL_PASSWORD ||
      process.env.MYSQL_DATABASE,
  );
}

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
      connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT ?? 10),
      waitForConnections: true,
      namedPlaceholders: true,
    });
  }

  return pool;
}

async function readLocalUsers() {
  try {
    return JSON.parse(await readFile(localDataPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeLocalUsers(users) {
  fileWrite = fileWrite.then(async () => {
    await mkdir(path.dirname(localDataPath), { recursive: true });
    await writeFile(localDataPath, `${JSON.stringify(users, null, 2)}\n`);
  });

  await fileWrite;
}

export async function initializeUsersTable() {
  if (!hasMysqlConfig()) {
    await writeLocalUsers(await readLocalUsers());
    return;
  }

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

        try {
          await getPool().query("ALTER TABLE users MODIFY password_hash JSON NULL");
        } catch {
          // Older installs may not have this legacy password column, which is fine.
        }
      } catch (error) {
        initialized = undefined;
        throw error;
      }
    })();
  }

  await initialized;
}

function parseUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
}

async function selectOne(sql, params, localSelector) {
  await initializeUsersTable();

  if (!hasMysqlConfig()) {
    return parseUser((await readLocalUsers()).find(localSelector));
  }

  const [rows] = await getPool().execute(sql, params);

  return parseUser(rows[0]);
}

export async function getUserById(id) {
  return selectOne("SELECT * FROM users WHERE id = ? LIMIT 1", [id], (user) => user.id === id);
}

export async function getUserByUsername(username) {
  return selectOne(
    "SELECT * FROM users WHERE username = ? LIMIT 1",
    [username],
    (user) => user.username === username,
  );
}

export async function getUserByEmail(email) {
  return selectOne("SELECT * FROM users WHERE email = ? LIMIT 1", [email], (user) => user.email === email);
}

export async function getUserByUsernameAndEmail(username, email) {
  return selectOne(
    "SELECT * FROM users WHERE username = ? AND email = ? LIMIT 1",
    [username, email],
    (user) => user.username === username && user.email === email,
  );
}

export async function createUser({ id, username, email }) {
  await initializeUsersTable();

  if (!hasMysqlConfig()) {
    const users = await readLocalUsers();

    if (users.some((user) => user.username === username)) {
      throw new Error("Duplicate username");
    }

    if (users.some((user) => user.email === email)) {
      throw new Error("Duplicate email");
    }

    const now = new Date().toISOString();
    const user = { id, username, email, createdAt: now, updatedAt: now };
    users.push(user);
    await writeLocalUsers(users);

    return user;
  }

  await getPool().execute("INSERT INTO users (id, username, email) VALUES (?, ?, ?)", [id, username, email]);

  return getUserById(id);
}
