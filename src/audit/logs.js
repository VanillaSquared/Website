import "server-only";

import { getPool, initializeUsersTable, listUsers } from "@/auth/openSQL";

export const AUDIT_LOG_TYPES = Object.freeze([
  "user_management",
  "user_action",
  "bug_reporter_action",
  "comment_action",
  "bug_panel_action",
]);

let auditLogTablesInitialized;

function safeJson(value) {
  if (value === undefined) return null;
  return JSON.stringify(value ?? null);
}

function parseJson(value) {
  if (value == null) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function parseLog(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    type: row.type,
    action: row.action,
    actorUserId: row.actor_user_id,
    targetUserId: row.target_user_id,
    actor: row.actor_username ? { id: row.actor_user_id, username: row.actor_username, email: row.actor_email } : null,
    target: row.target_username ? { id: row.target_user_id, username: row.target_username, email: row.target_email } : null,
    summary: row.summary,
    beforeData: parseJson(row.before_data),
    afterData: parseJson(row.after_data),
    metadata: parseJson(row.metadata),
    createdAt: row.created_at,
  };
}

export async function initializeAuditLogTable() {
  if (!auditLogTablesInitialized) {
    auditLogTablesInitialized = (async () => {
      await initializeUsersTable();
      await getPool().query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          type VARCHAR(64) NOT NULL,
          action VARCHAR(128) NOT NULL,
          actor_user_id CHAR(36) NULL,
          target_user_id CHAR(36) NULL,
          summary VARCHAR(512) NOT NULL,
          before_data JSON NULL,
          after_data JSON NULL,
          metadata JSON NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX audit_logs_type_created_at_idx (type, created_at),
          INDEX audit_logs_actor_created_at_idx (actor_user_id, created_at),
          INDEX audit_logs_target_created_at_idx (target_user_id, created_at),
          CONSTRAINT audit_logs_actor_user_id_fk FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
          CONSTRAINT audit_logs_target_user_id_fk FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL
        )
      `);
    })().catch((error) => {
      auditLogTablesInitialized = undefined;
      throw error;
    });
  }

  await auditLogTablesInitialized;
}

export async function createAuditLog({ type, action, actorUserId = null, targetUserId = null, summary = "", beforeData = null, afterData = null, metadata = null }) {
  if (!AUDIT_LOG_TYPES.includes(type) || !action) return null;

  await initializeAuditLogTable();
  const [result] = await getPool().execute(
    `INSERT INTO audit_logs (type, action, actor_user_id, target_user_id, summary, before_data, after_data, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [type, String(action).slice(0, 128), actorUserId || null, targetUserId || null, String(summary || action).slice(0, 512), safeJson(beforeData), safeJson(afterData), safeJson(metadata)]
  );
  return result.insertId;
}

export async function listAuditLogs({ search = "", users = [], types = [], tabType = "all", limit = 30, cursor = null } = {}) {
  await initializeAuditLogTable();

  const cleanLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);
  const cleanUsers = [...new Set((Array.isArray(users) ? users : []).map(String).filter(Boolean))].slice(0, 10);
  const cleanTypes = [...new Set((Array.isArray(types) ? types : []).filter((type) => AUDIT_LOG_TYPES.includes(type)))];
  const tabTypes = tabType && tabType !== "all" && AUDIT_LOG_TYPES.includes(tabType) ? [tabType] : [];
  const activeTypes = tabTypes.length && cleanTypes.length ? cleanTypes.filter((type) => tabTypes.includes(type)) : (tabTypes.length ? tabTypes : cleanTypes);
  const impossibleTypeFilter = tabTypes.length && cleanTypes.length && activeTypes.length === 0;
  const where = [];
  const params = [];

  if (impossibleTypeFilter) {
    where.push("1 = 0");
  } else if (activeTypes.length) {
    where.push(`l.type IN (${activeTypes.map(() => "?").join(", ")})`);
    params.push(...activeTypes);
  }

  if (cleanUsers.length) {
    where.push(`(l.actor_user_id IN (${cleanUsers.map(() => "?").join(", ")}) OR l.target_user_id IN (${cleanUsers.map(() => "?").join(", ")}))`);
    params.push(...cleanUsers, ...cleanUsers);
  }

  const normalizedSearch = String(search ?? "").trim();
  if (normalizedSearch) {
    where.push(`(l.summary LIKE ? OR l.action LIKE ? OR l.type LIKE ? OR actor.username LIKE ? OR target.username LIKE ? OR actor.email LIKE ? OR target.email LIKE ?)`);
    const like = `%${normalizedSearch}%`;
    params.push(like, like, like, like, like, like, like);
  }

  if (cursor) {
    where.push("l.id < ?");
    params.push(Number(cursor));
  }

  const [rows] = await getPool().execute(
    `SELECT l.*, actor.username AS actor_username, actor.email AS actor_email, target.username AS target_username, target.email AS target_email
     FROM audit_logs l
     LEFT JOIN users actor ON actor.id = l.actor_user_id
     LEFT JOIN users target ON target.id = l.target_user_id
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY l.id DESC
     LIMIT ${cleanLimit + 1}`,
    params
  );

  const hasMore = rows.length > cleanLimit;
  const pageRows = hasMore ? rows.slice(0, cleanLimit) : rows;
  return {
    logs: pageRows.map(parseLog),
    nextCursor: hasMore ? pageRows[pageRows.length - 1]?.id ?? null : null,
    hasMore,
  };
}

export async function getAuditLogUsers() {
  await initializeAuditLogTable();
  return listUsers();
}
