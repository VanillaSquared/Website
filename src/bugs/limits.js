import "server-only";

import { getPool, getUserById, initializeUsersTable, listUsers } from "@/auth/openSQL";

const DEFAULT_LIMIT_AMOUNT = 1;
const DEFAULT_LIMIT_DURATION = "1d";
const MAX_LIMIT_AMOUNT = 100000;
const UNIT_MS = Object.freeze({
  m: 60 * 1000,
  minute: 60 * 1000,
  minutes: 60 * 1000,
  h: 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  hours: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
  y: 365 * 24 * 60 * 60 * 1000,
  year: 365 * 24 * 60 * 60 * 1000,
  years: 365 * 24 * 60 * 60 * 1000,
});

let bugLimitTablesInitialized;

function parseRow(row) {
  if (!row) return null;
  return {
    userId: row.user_id,
    username: row.username,
    email: row.email,
    expiresAt: row.expires_at,
    permanent: Boolean(row.permanent),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseDuration(value, { allowPermanent = false } = {}) {
  const input = String(value ?? "").trim().toLowerCase();

  if (allowPermanent && input === "-1") {
    return { permanent: true, milliseconds: null, normalized: "-1" };
  }

  if (!input || input.includes("-")) {
    return null;
  }

  let index = 0;
  let milliseconds = 0;
  const compact = /(\d+)\s*([a-z]+)|(\d+)\s*\(\s*([a-z]+)\s*\)/y;

  while (index < input.length) {
    if (input[index] === "." || /\s/.test(input[index])) {
      index += 1;
      continue;
    }

    compact.lastIndex = index;
    const match = compact.exec(input);
    if (!match) return null;

    const amount = Number(match[1] ?? match[3]);
    const unit = match[2] ?? match[4];
    const unitMs = UNIT_MS[unit];

    if (!Number.isSafeInteger(amount) || amount <= 0 || !unitMs) {
      return null;
    }

    milliseconds += amount * unitMs;
    index = compact.lastIndex;
  }

  if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
    return null;
  }

  return { permanent: false, milliseconds, normalized: input.replace(/\s+/g, "") };
}

export function parseLimitDuration(value) {
  return parseDuration(value);
}

export function parsePunishmentDuration(value) {
  return parseDuration(value, { allowPermanent: true });
}

export function parsePositiveLimitAmount(value) {
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount > 0 && amount <= MAX_LIMIT_AMOUNT ? amount : null;
}

export async function initializeBugLimitTables() {
  if (!bugLimitTablesInitialized) {
    bugLimitTablesInitialized = (async () => {
      try {
        await initializeUsersTable();
        await getPool().query(`
          CREATE TABLE IF NOT EXISTS bug_limit_config (
            id TINYINT PRIMARY KEY,
            amount INT UNSIGNED NOT NULL,
            duration VARCHAR(64) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
        await getPool().query(`
          CREATE TABLE IF NOT EXISTS bug_report_punishments (
            user_id CHAR(36) PRIMARY KEY,
            expires_at TIMESTAMP NULL,
            permanent BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT bug_report_punishments_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);
        await getPool().execute(
          "INSERT IGNORE INTO bug_limit_config (id, amount, duration) VALUES (1, ?, ?)",
          [DEFAULT_LIMIT_AMOUNT, DEFAULT_LIMIT_DURATION]
        );
      } catch (error) {
        bugLimitTablesInitialized = undefined;
        throw error;
      }
    })();
  }

  await bugLimitTablesInitialized;
}

export async function getBugLimitConfig() {
  await initializeBugLimitTables();
  const [rows] = await getPool().execute("SELECT amount, duration FROM bug_limit_config WHERE id = 1 LIMIT 1");
  const row = rows[0] ?? { amount: DEFAULT_LIMIT_AMOUNT, duration: DEFAULT_LIMIT_DURATION };
  return { amount: Number(row.amount), duration: row.duration };
}

export async function updateBugLimitConfig({ amount, duration }) {
  const parsedAmount = parsePositiveLimitAmount(amount);
  const parsedDuration = parseLimitDuration(duration);

  if (!parsedAmount) {
    const error = new Error("Bug count must be a positive integer.");
    error.status = 400;
    throw error;
  }

  if (!parsedDuration) {
    const error = new Error("Enter a valid time limit duration.");
    error.status = 400;
    throw error;
  }

  await initializeBugLimitTables();
  await getPool().execute(
    "INSERT INTO bug_limit_config (id, amount, duration) VALUES (1, ?, ?) ON DUPLICATE KEY UPDATE amount = VALUES(amount), duration = VALUES(duration)",
    [parsedAmount, parsedDuration.normalized]
  );
  return getBugLimitConfig();
}

export async function listActiveBugPunishments() {
  await initializeBugLimitTables();
  const [rows] = await getPool().execute(
    `SELECT p.user_id, p.expires_at, p.permanent, p.created_at, p.updated_at, users.username, users.email
     FROM bug_report_punishments p
     INNER JOIN users ON users.id = p.user_id
     WHERE p.permanent = TRUE OR p.expires_at > NOW()
     ORDER BY p.permanent DESC, p.expires_at ASC, users.username ASC`
  );
  return rows.map(parseRow);
}

export async function getActiveBugPunishment(userId) {
  await initializeBugLimitTables();
  const [rows] = await getPool().execute(
    `SELECT p.user_id, p.expires_at, p.permanent, p.created_at, p.updated_at, users.username, users.email
     FROM bug_report_punishments p
     INNER JOIN users ON users.id = p.user_id
     WHERE p.user_id = ? AND (p.permanent = TRUE OR p.expires_at > NOW())
     LIMIT 1`,
    [userId]
  );
  return parseRow(rows[0]);
}

async function savePunishment(userId, parsedDuration) {
  const expiresAt = parsedDuration.permanent ? null : new Date(Date.now() + parsedDuration.milliseconds);
  await getPool().execute(
    "INSERT INTO bug_report_punishments (user_id, expires_at, permanent) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at), permanent = VALUES(permanent)",
    [userId, expiresAt, parsedDuration.permanent]
  );
}

export async function upsertBugPunishments(userIds, duration) {
  const parsedDuration = parsePunishmentDuration(duration);
  const ids = Array.isArray(userIds) ? [...new Set(userIds.map((id) => String(id ?? "").trim()).filter(Boolean))] : [];

  if (!ids.length) {
    const error = new Error("Select at least one user.");
    error.status = 400;
    throw error;
  }

  if (!parsedDuration) {
    const error = new Error("Enter a valid punishment duration.");
    error.status = 400;
    throw error;
  }

  await initializeBugLimitTables();
  for (const id of ids) {
    if (!await getUserById(id)) {
      const error = new Error("One or more selected users do not exist.");
      error.status = 400;
      throw error;
    }
  }

  await Promise.all(ids.map((id) => savePunishment(id, parsedDuration)));
  return listActiveBugPunishments();
}

export async function updateBugPunishment(userId, duration) {
  const parsedDuration = parsePunishmentDuration(duration);
  if (!parsedDuration) {
    const error = new Error("Enter a valid punishment duration.");
    error.status = 400;
    throw error;
  }

  await initializeBugLimitTables();
  if (!await getUserById(userId)) {
    const error = new Error("User not found.");
    error.status = 404;
    throw error;
  }

  await savePunishment(userId, parsedDuration);
  return getActiveBugPunishment(userId);
}

export async function removeBugPunishment(userId) {
  await initializeBugLimitTables();
  await getPool().execute("DELETE FROM bug_report_punishments WHERE user_id = ?", [userId]);
}

export async function countUserBugReportsInWindow(userId, windowStart) {
  await initializeBugLimitTables();
  const [rows] = await getPool().execute(
    "SELECT COUNT(*) AS report_count FROM bug_reports WHERE creator_user_id = ? AND created_at >= ?",
    [userId, windowStart]
  );
  return Number(rows[0]?.report_count ?? 0);
}

async function getOldestUserBugReportInWindow(userId, windowStart) {
  await initializeBugLimitTables();
  const [rows] = await getPool().execute(
    "SELECT MIN(created_at) AS oldest_created_at FROM bug_reports WHERE creator_user_id = ? AND created_at >= ?",
    [userId, windowStart]
  );
  return rows[0]?.oldest_created_at ?? null;
}

export async function listBugPanelUsers() {
  await initializeBugLimitTables();
  return listUsers();
}

export async function checkBugCreationAllowed(userId, { bypassLimits = false } = {}) {
  if (bypassLimits) return { allowed: true };

  const punishment = await getActiveBugPunishment(userId);
  if (punishment) {
    return {
      allowed: false,
      reason: "punishment",
      permanent: punishment.permanent,
      blockedUntil: punishment.permanent ? null : punishment.expiresAt,
      error: punishment.permanent
        ? "You are permanently blocked from creating bug reports."
        : `You are blocked from creating bug reports until ${new Date(punishment.expiresAt).toLocaleString()}.`,
    };
  }

  const config = await getBugLimitConfig();
  const duration = parseLimitDuration(config.duration);
  if (!duration) return { allowed: true };

  const windowStart = new Date(Date.now() - duration.milliseconds);
  const count = await countUserBugReportsInWindow(userId, windowStart);

  if (count >= config.amount) {
    const oldestCreatedAt = await getOldestUserBugReportInWindow(userId, windowStart);
    const oldestTime = oldestCreatedAt ? new Date(oldestCreatedAt).getTime() : Date.now();

    return {
      allowed: false,
      reason: "limit",
      blockedUntil: new Date(oldestTime + duration.milliseconds),
      limitAmount: config.amount,
      limitDuration: config.duration,
      error: `You can only create ${config.amount} bug per ${config.duration}.`,
    };
  }

  return { allowed: true };
}
