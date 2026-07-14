import "server-only";

import { randomUUID } from "node:crypto";

import { getPool, getUserById, initializeUsersTable, listUsers } from "@/auth/openSQL";
import { formatEuropeanDateTime } from "@/utils/dateTime";

export const PUNISHMENT_TYPES = Object.freeze({
  BUG_CREATION: "bug_creation",
  COMMENT_CREATION: "comment_creation",
});

export const PUNISHMENT_TYPE_OPTIONS = Object.freeze([
  { value: PUNISHMENT_TYPES.BUG_CREATION, label: "Bug creation" },
  { value: PUNISHMENT_TYPES.COMMENT_CREATION, label: "Comment creation" },
]);
export const PUNISHMENT_TYPE_VALUES = Object.freeze(PUNISHMENT_TYPE_OPTIONS.map((option) => option.value));

const DEFAULT_LIMIT_AMOUNT = 1;
const DEFAULT_LIMIT_DURATION = "1d";
const DEFAULT_REACTION_COUNT_LIMIT = 3200;
const DEFAULT_REACTION_TYPE_LIMIT = 20;
export const DEFAULT_COMMENT_CHARACTER_LIMIT = 1000;
export const DEFAULT_COMMENT_COOLDOWN_SECONDS = 5;
export const DEFAULT_AFFECTED_VERSIONS = Object.freeze([
  "1.21.4",
  "1.21.3",
  "1.21.1",
  "1.20.6",
  "1.20.4",
  "Website",
  "Unknown",
]);
const DEFAULT_AUTOMOD_ENABLED = true;
const DEFAULT_BLOCKED_PHRASES = Object.freeze(["fuck", "shit", "bitch", "nigger", "faggot", "kill yourself", "kys"]);
const DEFAULT_ALLOWED_LINK_HOSTS = Object.freeze(["minecraft.wiki", "youtube.com", "youtu.be"]);
const MAX_LIMIT_AMOUNT = 100000;
const MAX_CONFIG_LIST_ITEMS = 200;
const MAX_CONFIG_LIST_ITEM_LENGTH = 120;
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

function punishmentStatus(row) {
  if (row.revoked_at) return "revoked";
  if (!row.permanent && row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) return "expired";
  return "active";
}

function parseRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    email: row.email,
    type: row.type,
    reason: row.reason ?? "",
    expiresAt: row.expires_at,
    permanent: Boolean(row.permanent),
    revokedAt: row.revoked_at,
    revokedByUserId: row.revoked_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: punishmentStatus(row),
  };
}

function parseDuration(value, { allowPermanent = false } = {}) {
  const input = String(value ?? "").trim().toLowerCase();
  if (allowPermanent && input === "-1") return { permanent: true, milliseconds: null, normalized: "-1" };
  if (!input || input.includes("-")) return null;

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
    const unitMs = UNIT_MS[match[2] ?? match[4]];
    if (!Number.isSafeInteger(amount) || amount <= 0 || !unitMs) return null;
    milliseconds += amount * unitMs;
    index = compact.lastIndex;
  }
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return null;
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

async function createPunishmentsTable() {
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS bug_report_punishments (
      id CHAR(36) PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      type VARCHAR(32) NOT NULL,
      reason VARCHAR(500) NOT NULL DEFAULT '',
      expires_at TIMESTAMP NULL,
      permanent BOOLEAN NOT NULL DEFAULT FALSE,
      revoked_at TIMESTAMP NULL,
      revoked_by_user_id CHAR(36) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX bug_punishments_user_status_idx (user_id, type, revoked_at, expires_at),
      CONSTRAINT bug_punishments_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT bug_punishments_revoked_by_fk FOREIGN KEY (revoked_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
}

async function migrateLegacyPunishments() {
  const [[currentTables], [legacyTables]] = await Promise.all([
    getPool().query("SHOW TABLES LIKE 'bug_report_punishments'"),
    getPool().query("SHOW TABLES LIKE 'bug_report_punishments_legacy'"),
  ]);

  if (currentTables.length) {
    const [columns] = await getPool().query("SHOW COLUMNS FROM bug_report_punishments");
    if (!columns.some((column) => column.Field === "id")) {
      if (legacyTables.length) {
        throw new Error("Cannot migrate punishments while a legacy backup table already exists.");
      }
      await getPool().query("RENAME TABLE bug_report_punishments TO bug_report_punishments_legacy");
    }
  }

  await createPunishmentsTable();
  const [remainingLegacyTables] = await getPool().query("SHOW TABLES LIKE 'bug_report_punishments_legacy'");
  if (!remainingLegacyTables.length) return;

  await getPool().query(
    `INSERT INTO bug_report_punishments (id, user_id, type, expires_at, permanent, created_at, updated_at)
     SELECT UUID(), legacy.user_id, ?, legacy.expires_at, legacy.permanent, legacy.created_at, legacy.updated_at
     FROM bug_report_punishments_legacy legacy
     WHERE NOT EXISTS (
       SELECT 1 FROM bug_report_punishments current
       WHERE current.user_id = legacy.user_id AND current.type = ? AND current.created_at = legacy.created_at
     )`,
    [PUNISHMENT_TYPES.BUG_CREATION, PUNISHMENT_TYPES.BUG_CREATION]
  );
  await getPool().query("DROP TABLE bug_report_punishments_legacy");
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
            reaction_count_limit INT UNSIGNED NOT NULL DEFAULT 3200,
            reaction_type_limit INT UNSIGNED NOT NULL DEFAULT 20,
            comment_character_limit INT UNSIGNED NOT NULL DEFAULT 1000,
            comment_cooldown_seconds INT UNSIGNED NOT NULL DEFAULT 5,
            lockdown_enabled BOOLEAN NOT NULL DEFAULT FALSE,
            affected_versions JSON NULL,
            automod_enabled BOOLEAN NOT NULL DEFAULT TRUE,
            automod_blocked_phrases JSON NULL,
            allowed_link_hosts JSON NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
        await Promise.all([
          getPool().query("ALTER TABLE bug_limit_config ADD COLUMN reaction_count_limit INT UNSIGNED NOT NULL DEFAULT 3200").catch((error) => { if (error.code !== "ER_DUP_FIELDNAME") throw error; }),
          getPool().query("ALTER TABLE bug_limit_config ADD COLUMN reaction_type_limit INT UNSIGNED NOT NULL DEFAULT 20").catch((error) => { if (error.code !== "ER_DUP_FIELDNAME") throw error; }),
          getPool().query("ALTER TABLE bug_limit_config ADD COLUMN comment_character_limit INT UNSIGNED NOT NULL DEFAULT 1000").catch((error) => { if (error.code !== "ER_DUP_FIELDNAME") throw error; }),
          getPool().query("ALTER TABLE bug_limit_config ADD COLUMN comment_cooldown_seconds INT UNSIGNED NOT NULL DEFAULT 5").catch((error) => { if (error.code !== "ER_DUP_FIELDNAME") throw error; }),
          getPool().query("ALTER TABLE bug_limit_config ADD COLUMN lockdown_enabled BOOLEAN NOT NULL DEFAULT FALSE").catch((error) => { if (error.code !== "ER_DUP_FIELDNAME") throw error; }),
          getPool().query("ALTER TABLE bug_limit_config ADD COLUMN affected_versions JSON NULL").catch((error) => { if (error.code !== "ER_DUP_FIELDNAME") throw error; }),
          getPool().query("ALTER TABLE bug_limit_config ADD COLUMN automod_enabled BOOLEAN NOT NULL DEFAULT TRUE").catch((error) => { if (error.code !== "ER_DUP_FIELDNAME") throw error; }),
          getPool().query("ALTER TABLE bug_limit_config ADD COLUMN automod_blocked_phrases JSON NULL").catch((error) => { if (error.code !== "ER_DUP_FIELDNAME") throw error; }),
          getPool().query("ALTER TABLE bug_limit_config ADD COLUMN allowed_link_hosts JSON NULL").catch((error) => { if (error.code !== "ER_DUP_FIELDNAME") throw error; }),
        ]);
        await migrateLegacyPunishments();
        await getPool().query("ALTER TABLE bug_report_punishments ADD COLUMN reason VARCHAR(500) NOT NULL DEFAULT '' AFTER type").catch((error) => { if (error.code !== "ER_DUP_FIELDNAME") throw error; });
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

function parseStoredList(value, fallback) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return [...fallback];
    }
  }
  return [...fallback];
}

function normalizeConfigList(value, label, transform = (item) => item) {
  const source = Array.isArray(value) ? value : String(value ?? "").split(/\r?\n/);
  const normalized = [...new Set(source.map((item) => transform(String(item).trim())).filter(Boolean))];
  if (normalized.length > MAX_CONFIG_LIST_ITEMS || normalized.some((item) => item.length > MAX_CONFIG_LIST_ITEM_LENGTH)) {
    const error = new Error(`${label} must contain at most ${MAX_CONFIG_LIST_ITEMS} entries of ${MAX_CONFIG_LIST_ITEM_LENGTH} characters or fewer.`);
    error.status = 400;
    throw error;
  }
  return normalized;
}

function normalizeHostname(value) {
  const input = value.toLowerCase().replace(/^https?:\/\//, "").replace(/^\*\./, "").split("/")[0].replace(/\.$/, "");
  return /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(input) ? input : "";
}

export async function getBugLimitConfig() {
  await initializeBugLimitTables();
  const [rows] = await getPool().execute("SELECT amount, duration, reaction_count_limit, reaction_type_limit, comment_character_limit, comment_cooldown_seconds, lockdown_enabled, affected_versions, automod_enabled, automod_blocked_phrases, allowed_link_hosts FROM bug_limit_config WHERE id = 1 LIMIT 1");
  const row = rows[0] ?? {};
  return {
    amount: Number(row.amount ?? DEFAULT_LIMIT_AMOUNT),
    duration: row.duration ?? DEFAULT_LIMIT_DURATION,
    reactionCountLimit: Number(row.reaction_count_limit ?? DEFAULT_REACTION_COUNT_LIMIT),
    reactionTypeLimit: Number(row.reaction_type_limit ?? DEFAULT_REACTION_TYPE_LIMIT),
    commentCharacterLimit: Number(row.comment_character_limit ?? DEFAULT_COMMENT_CHARACTER_LIMIT),
    commentCooldownSeconds: Number(row.comment_cooldown_seconds ?? DEFAULT_COMMENT_COOLDOWN_SECONDS),
    lockdownEnabled: Boolean(row.lockdown_enabled),
    affectedVersions: parseStoredList(row.affected_versions, DEFAULT_AFFECTED_VERSIONS),
    automodEnabled: row.automod_enabled == null ? DEFAULT_AUTOMOD_ENABLED : Boolean(row.automod_enabled),
    blockedPhrases: parseStoredList(row.automod_blocked_phrases, DEFAULT_BLOCKED_PHRASES),
    allowedLinkHosts: parseStoredList(row.allowed_link_hosts, DEFAULT_ALLOWED_LINK_HOSTS),
  };
}

export async function updateBugLimitConfig({ amount, duration, reactionCountLimit, reactionTypeLimit, commentCharacterLimit, commentCooldownSeconds, lockdownEnabled, affectedVersions, automodEnabled, blockedPhrases, allowedLinkHosts }) {
  const parsedAmount = parsePositiveLimitAmount(amount);
  const parsedDuration = parseLimitDuration(duration);
  const parsedReactionCountLimit = parsePositiveLimitAmount(reactionCountLimit);
  const parsedReactionTypeLimit = parsePositiveLimitAmount(reactionTypeLimit);
  const parsedCommentCharacterLimit = parsePositiveLimitAmount(commentCharacterLimit);
  const parsedCommentCooldownSeconds = Number(commentCooldownSeconds);
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
  if (!parsedReactionCountLimit || !parsedReactionTypeLimit) {
    const error = new Error("Reaction limits must be positive integers.");
    error.status = 400;
    throw error;
  }
  if (!parsedCommentCharacterLimit) {
    const error = new Error("Comment character limit must be a positive integer.");
    error.status = 400;
    throw error;
  }
  if (!Number.isSafeInteger(parsedCommentCooldownSeconds) || parsedCommentCooldownSeconds < 0 || parsedCommentCooldownSeconds > MAX_LIMIT_AMOUNT) {
    const error = new Error(`Comment cooldown must be a whole number between 0 and ${MAX_LIMIT_AMOUNT} seconds.`);
    error.status = 400;
    throw error;
  }
  if (typeof lockdownEnabled !== "boolean") {
    const error = new Error("Choose a valid lockdown setting.");
    error.status = 400;
    throw error;
  }
  if (typeof automodEnabled !== "boolean") {
    const error = new Error("Choose a valid automoderation setting.");
    error.status = 400;
    throw error;
  }
  const normalizedAffectedVersions = normalizeConfigList(affectedVersions, "Affected versions");
  if (!normalizedAffectedVersions.length) {
    const error = new Error("Configure at least one affected version.");
    error.status = 400;
    throw error;
  }
  const normalizedBlockedPhrases = normalizeConfigList(blockedPhrases, "Blocked words and phrases", (item) => item.toLocaleLowerCase("en-GB"));
  const submittedHosts = Array.isArray(allowedLinkHosts) ? allowedLinkHosts : String(allowedLinkHosts ?? "").split(/\r?\n/);
  const normalizedAllowedLinkHosts = normalizeConfigList(submittedHosts, "Allowed link hosts", normalizeHostname);
  if (submittedHosts.some((host) => String(host).trim() && !normalizeHostname(String(host).trim()))) {
    const error = new Error("Enter valid allowed hostnames without paths, such as youtube.com.");
    error.status = 400;
    throw error;
  }
  await initializeBugLimitTables();
  await getPool().execute(
    `INSERT INTO bug_limit_config (id, amount, duration, reaction_count_limit, reaction_type_limit, comment_character_limit, comment_cooldown_seconds, lockdown_enabled, affected_versions, automod_enabled, automod_blocked_phrases, allowed_link_hosts)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE amount = VALUES(amount), duration = VALUES(duration), reaction_count_limit = VALUES(reaction_count_limit), reaction_type_limit = VALUES(reaction_type_limit), comment_character_limit = VALUES(comment_character_limit), comment_cooldown_seconds = VALUES(comment_cooldown_seconds), lockdown_enabled = VALUES(lockdown_enabled), affected_versions = VALUES(affected_versions), automod_enabled = VALUES(automod_enabled), automod_blocked_phrases = VALUES(automod_blocked_phrases), allowed_link_hosts = VALUES(allowed_link_hosts)`,
    [parsedAmount, parsedDuration.normalized, parsedReactionCountLimit, parsedReactionTypeLimit, parsedCommentCharacterLimit, parsedCommentCooldownSeconds, lockdownEnabled, JSON.stringify(normalizedAffectedVersions), automodEnabled, JSON.stringify(normalizedBlockedPhrases), JSON.stringify(normalizedAllowedLinkHosts)]
  );
  return getBugLimitConfig();
}

const punishmentSelect = `SELECT p.*, users.username, users.email
  FROM bug_report_punishments p
  INNER JOIN users ON users.id = p.user_id`;

export async function listBugPunishments() {
  await initializeBugLimitTables();
  const [rows] = await getPool().query(`${punishmentSelect} ORDER BY users.username, p.created_at DESC`);
  return rows.map(parseRow);
}

export async function listActiveBugPunishments() {
  return (await listBugPunishments()).filter((punishment) => punishment.status === "active");
}

export async function getBugPunishment(punishmentId) {
  await initializeBugLimitTables();
  const [rows] = await getPool().execute(`${punishmentSelect} WHERE p.id = ? LIMIT 1`, [punishmentId]);
  return parseRow(rows[0]);
}

export async function getActivePunishment(userId, type) {
  await initializeBugLimitTables();
  const [rows] = await getPool().execute(
    `${punishmentSelect}
     WHERE p.user_id = ? AND p.type = ? AND p.revoked_at IS NULL
       AND (p.permanent = TRUE OR p.expires_at > NOW())
     ORDER BY p.created_at DESC LIMIT 1`,
    [userId, type]
  );
  return parseRow(rows[0]);
}

export async function getActiveBugPunishment(userId) {
  return getActivePunishment(userId, PUNISHMENT_TYPES.BUG_CREATION);
}

export async function createBugPunishments(userIds, types, duration, reason) {
  const parsedDuration = parsePunishmentDuration(duration);
  const normalizedReason = String(reason ?? "").trim();
  const ids = Array.isArray(userIds) ? [...new Set(userIds.map((id) => String(id ?? "").trim()).filter(Boolean))] : [];
  const normalizedTypes = Array.isArray(types) ? [...new Set(types.map(String).filter((type) => PUNISHMENT_TYPE_VALUES.includes(type)))] : [];
  if (!ids.length) {
    const error = new Error("Select at least one user.");
    error.status = 400;
    throw error;
  }
  if (!normalizedTypes.length || normalizedTypes.length !== new Set((Array.isArray(types) ? types : []).map(String)).size) {
    const error = new Error("Select at least one valid punishment type.");
    error.status = 400;
    throw error;
  }
  if (!parsedDuration) {
    const error = new Error("Enter a valid punishment duration.");
    error.status = 400;
    throw error;
  }
  if (!normalizedReason || normalizedReason.length > 500) {
    const error = new Error("Enter a punishment reason of 500 characters or fewer.");
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

  const expiresAt = parsedDuration.permanent ? null : new Date(Date.now() + parsedDuration.milliseconds);
  const createdIds = [];
  for (const userId of ids) {
    for (const type of normalizedTypes) {
      const id = randomUUID();
      await getPool().execute(
        "INSERT INTO bug_report_punishments (id, user_id, type, reason, expires_at, permanent) VALUES (?, ?, ?, ?, ?, ?)",
        [id, userId, type, normalizedReason, expiresAt, parsedDuration.permanent]
      );
      createdIds.push(id);
    }
  }
  return Promise.all(createdIds.map(getBugPunishment));
}

export async function updateBugPunishment(punishmentId, duration) {
  const parsedDuration = parsePunishmentDuration(duration);
  if (!parsedDuration) {
    const error = new Error("Enter a valid punishment duration.");
    error.status = 400;
    throw error;
  }
  const current = await getBugPunishment(punishmentId);
  if (!current) {
    const error = new Error("Punishment not found.");
    error.status = 404;
    throw error;
  }
  if (current.status !== "active") {
    const error = new Error("Only active punishments can be edited.");
    error.status = 409;
    throw error;
  }
  const expiresAt = parsedDuration.permanent ? null : new Date(Date.now() + parsedDuration.milliseconds);
  await getPool().execute(
    "UPDATE bug_report_punishments SET expires_at = ?, permanent = ? WHERE id = ? AND revoked_at IS NULL AND (permanent = TRUE OR expires_at > NOW())",
    [expiresAt, parsedDuration.permanent, punishmentId]
  );
  return getBugPunishment(punishmentId);
}

export async function revokeBugPunishment(punishmentId, actorUserId) {
  const current = await getBugPunishment(punishmentId);
  if (!current) {
    const error = new Error("Punishment not found.");
    error.status = 404;
    throw error;
  }
  if (current.status !== "active") {
    const error = new Error("Only active punishments can be revoked.");
    error.status = 409;
    throw error;
  }
  await getPool().execute(
    "UPDATE bug_report_punishments SET revoked_at = CURRENT_TIMESTAMP, revoked_by_user_id = ? WHERE id = ? AND revoked_at IS NULL",
    [actorUserId, punishmentId]
  );
  return getBugPunishment(punishmentId);
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

function blockedByPunishment(punishment, actionLabel) {
  return {
    allowed: false,
    reason: "punishment",
    punishmentId: punishment.id,
    permanent: punishment.permanent,
    blockedUntil: punishment.permanent ? null : punishment.expiresAt,
    error: punishment.permanent
      ? `You are permanently blocked from ${actionLabel}.`
      : `You are blocked from ${actionLabel} until ${formatEuropeanDateTime(punishment.expiresAt)}.`,
  };
}

export async function checkCommentCreationAllowed(userId, { bypassLimits = false } = {}) {
  if (bypassLimits) return { allowed: true };
  const punishment = await getActivePunishment(userId, PUNISHMENT_TYPES.COMMENT_CREATION);
  return punishment ? blockedByPunishment(punishment, "creating comments") : { allowed: true };
}

export async function checkLockdownAllowed({ bypassLockdown = false } = {}) {
  if (bypassLockdown) return { allowed: true };
  const config = await getBugLimitConfig();
  return config.lockdownEnabled
    ? { allowed: false, reason: "lockdown", error: "The bug panel is currently in lockdown." }
    : { allowed: true };
}

export async function checkBugCreationAllowed(userId, { bypassLimits = false, bypassLockdown = false } = {}) {
  const lockdown = await checkLockdownAllowed({ bypassLockdown });
  if (!lockdown.allowed) return lockdown;
  if (bypassLimits) return { allowed: true };
  const punishment = await getActivePunishment(userId, PUNISHMENT_TYPES.BUG_CREATION);
  if (punishment) return blockedByPunishment(punishment, "creating bug reports");

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
