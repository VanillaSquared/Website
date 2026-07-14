import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { getPool } from "@/auth/openSQL";
import { moderateComment } from "@/bugs/commentModeration";
import { checkCommentCreationAllowed, checkLockdownAllowed, DEFAULT_COMMENT_CHARACTER_LIMIT, getBugLimitConfig } from "@/bugs/limits";
import {
  BUG_REPORT_ALLOWED_EXTENSIONS,
  BUG_REPORT_MAX_FILE_SIZE,
  initializeBugReporterTables,
} from "@/bugs/reporter";

export const COMMENT_MIN_LENGTH = 1;
export const COMMENT_MAX_ATTACHMENTS = 1;

const uploadsRoot = path.join(process.cwd(), ".data", "bug-comments");
let commentsInitialized;

export async function initializeCommentTables() {
  if (!commentsInitialized) {
    commentsInitialized = (async () => {
      try {
        await initializeBugReporterTables();
        await getPool().query(`
          CREATE TABLE IF NOT EXISTS bug_report_comments (
            id CHAR(36) PRIMARY KEY,
            bug_report_id CHAR(36) NOT NULL,
            creator_user_id CHAR(36) NULL,
            content MEDIUMTEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            edited_at TIMESTAMP NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX bug_comments_report_created_idx (bug_report_id, created_at),
            INDEX bug_comments_creator_created_idx (creator_user_id, created_at),
            CONSTRAINT bug_comments_report_fk FOREIGN KEY (bug_report_id) REFERENCES bug_reports(id) ON DELETE CASCADE,
            CONSTRAINT bug_comments_creator_fk FOREIGN KEY (creator_user_id) REFERENCES users(id) ON DELETE SET NULL
          )
        `);
        await getPool().query("ALTER TABLE bug_report_comments MODIFY content MEDIUMTEXT NOT NULL");
        await getPool().query("ALTER TABLE bug_report_comments ADD INDEX bug_comments_creator_created_idx (creator_user_id, created_at)").catch((error) => { if (error.code !== "ER_DUP_KEYNAME") throw error; });
        await getPool().query(`
          CREATE TABLE IF NOT EXISTS bug_report_comment_reactions (
            comment_id CHAR(36) NOT NULL,
            user_id CHAR(36) NOT NULL,
            emoji VARCHAR(32) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (comment_id, user_id, emoji),
            INDEX comment_reactions_comment_emoji_idx (comment_id, emoji),
            CONSTRAINT comment_reactions_comment_fk FOREIGN KEY (comment_id) REFERENCES bug_report_comments(id) ON DELETE CASCADE,
            CONSTRAINT comment_reactions_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);
        await getPool().query(`
          CREATE TABLE IF NOT EXISTS bug_report_comment_attachments (
            id CHAR(36) PRIMARY KEY,
            comment_id CHAR(36) NOT NULL UNIQUE,
            original_name VARCHAR(255) NOT NULL,
            stored_name VARCHAR(255) NOT NULL,
            extension VARCHAR(16) NOT NULL,
            size_bytes INT UNSIGNED NOT NULL,
            storage_path VARCHAR(512) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT comment_attachments_comment_fk FOREIGN KEY (comment_id) REFERENCES bug_report_comments(id) ON DELETE CASCADE
          )
        `);
      } catch (error) {
        commentsInitialized = undefined;
        throw error;
      }
    })();
  }
  await commentsInitialized;
}

function safeName(value) {
  return path.basename(String(value ?? "attachment")).slice(0, 255) || "attachment";
}

function extensionFor(name) {
  return path.extname(name).toLowerCase();
}

function isFileLike(value) {
  return value && typeof value === "object" && typeof value.arrayBuffer === "function";
}

export function validateCommentFormData(formData, { characterLimit = DEFAULT_COMMENT_CHARACTER_LIMIT } = {}) {
  const contentValues = formData.getAll("content");
  const content = String(contentValues[0] ?? "").trim();
  const submittedFiles = formData.getAll("attachment").filter((file) => isFileLike(file) && file.size > 0);
  const maximumLength = characterLimit;
  if (contentValues.length !== 1 || content.length < COMMENT_MIN_LENGTH || content.length > maximumLength) {
    return { error: `Enter a comment between ${COMMENT_MIN_LENGTH} and ${maximumLength} characters.` };
  }
  if (submittedFiles.length > COMMENT_MAX_ATTACHMENTS) return { error: "Upload at most one attachment." };
  const attachment = submittedFiles[0] ?? null;
  if (attachment) {
    const extension = extensionFor(safeName(attachment.name));
    if (!BUG_REPORT_ALLOWED_EXTENSIONS.includes(extension)) {
      return { error: "Attachments must be .log, .png, .txt, .json, or .html files." };
    }
    if (attachment.size > BUG_REPORT_MAX_FILE_SIZE) return { error: "The attachment must be 10 MB or smaller." };
  }
  return { data: { content, attachment } };
}

export function validateCommentContent(value, { characterLimit = DEFAULT_COMMENT_CHARACTER_LIMIT } = {}) {
  const content = String(value ?? "").trim();
  const maximumLength = characterLimit;
  if (content.length < COMMENT_MIN_LENGTH || content.length > maximumLength) {
    return { error: `Enter a comment between ${COMMENT_MIN_LENGTH} and ${maximumLength} characters.` };
  }
  return { data: content };
}

function mapAttachment(row) {
  if (!row?.attachment_id) return null;
  return {
    id: row.attachment_id,
    originalName: row.original_name,
    extension: row.extension,
    sizeBytes: Number(row.size_bytes),
    createdAt: row.attachment_created_at,
    ...(row.storage_path ? { storagePath: row.storage_path } : {}),
  };
}

function mapComment(row) {
  return {
    id: row.id,
    bugReportId: row.bug_report_id,
    creatorUserId: row.creator_user_id,
    creatorUsername: row.creator_username ?? "Deleted user",
    content: row.content,
    createdAt: row.created_at,
    editedAt: row.edited_at,
    updatedAt: row.updated_at,
    attachment: mapAttachment(row),
  };
}

const commentSelect = `SELECT c.id, c.bug_report_id, c.creator_user_id, c.content, c.created_at, c.edited_at, c.updated_at,
  users.username AS creator_username, a.id AS attachment_id, a.original_name, a.extension, a.size_bytes,
  a.storage_path, a.created_at AS attachment_created_at
  FROM bug_report_comments c
  LEFT JOIN users ON users.id = c.creator_user_id
  LEFT JOIN bug_report_comment_attachments a ON a.comment_id = c.id`;

export async function listComments(publicId, actorUserId = null) {
  await initializeCommentTables();
  const [rows] = await getPool().execute(
    `${commentSelect}
     INNER JOIN bug_reports b ON b.id = c.bug_report_id
     WHERE LOWER(b.public_id) = LOWER(?) ORDER BY c.created_at ASC, c.id ASC`,
    [String(publicId ?? "").trim()]
  );
  const comments = rows.map(mapComment);
  if (!comments.length) return [];
  const placeholders = comments.map(() => "?").join(", ");
  const [reactionRows] = await getPool().execute(
    `SELECT comment_id, emoji, COUNT(*) AS count, MAX(user_id = ?) AS reacted FROM bug_report_comment_reactions WHERE comment_id IN (${placeholders}) GROUP BY comment_id, emoji ORDER BY MIN(created_at)`,
    [actorUserId ?? "", ...comments.map((comment) => comment.id)]
  );
  return comments.map((comment) => ({
    ...comment,
    attachment: comment.attachment ? { ...comment.attachment, storagePath: undefined } : null,
    reactions: reactionRows.filter((reaction) => reaction.comment_id === comment.id).map((reaction) => ({ emoji: reaction.emoji, count: Number(reaction.count), reacted: Boolean(reaction.reacted) })),
  }));
}

async function getBug(publicId) {
  const [rows] = await getPool().execute(
    "SELECT id, public_id, creator_user_id, allow_comments, locked FROM bug_reports WHERE LOWER(public_id) = LOWER(?) LIMIT 1",
    [String(publicId ?? "").trim()]
  );
  return rows[0] ?? null;
}

async function saveAttachment(bugReportId, commentId, file) {
  if (!file) return null;
  const directory = path.join(uploadsRoot, bugReportId, commentId);
  await mkdir(directory, { recursive: true });
  const id = randomUUID();
  const originalName = safeName(file.name);
  const extension = extensionFor(originalName);
  const storedName = `${id}${extension}`;
  const storagePath = path.join(directory, storedName);
  await writeFile(storagePath, Buffer.from(await file.arrayBuffer()), { flag: "wx" });
  return { id, originalName, extension, storedName, storagePath, sizeBytes: file.size };
}

export async function createComment({ publicId, actorUserId, canWrite, bypassLimits = false, bypassLockdown = false, bypassReportLock = false, siteHostname = "", formData }) {
  if (!canWrite) return { error: "Forbidden", status: 403 };
  const lockdown = await checkLockdownAllowed({ bypassLockdown });
  if (!lockdown.allowed) return { error: lockdown.error, status: 403 };
  const config = await getBugLimitConfig();
  const validated = validateCommentFormData(formData, { characterLimit: config.commentCharacterLimit });
  if (validated.error) return { error: validated.error, status: 400 };
  await initializeCommentTables();
  const bug = await getBug(publicId);
  if (!bug) return { error: "Bug report not found.", status: 404 };
  if (bug.locked && !bypassReportLock) return { error: "This bug report is locked.", status: 403 };
  if (!bug.allow_comments) return { error: "Comments are disabled for this bug report.", status: 403 };
  const allowed = await checkCommentCreationAllowed(actorUserId, { bypassLimits });
  if (!allowed.allowed) return { error: allowed.error, status: 403 };
  const moderation = await moderateComment(validated.data.content, { siteHostname });
  if (!moderation.allowed) return { error: moderation.error, status: 400 };

  const id = randomUUID();
  const attachment = await saveAttachment(bug.id, id, validated.data.attachment);
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    if (!bypassLimits && config.commentCooldownSeconds > 0) {
      await connection.execute("SELECT id FROM users WHERE id = ? LIMIT 1 FOR UPDATE", [actorUserId]);
      const [recentRows] = await connection.execute(
        "SELECT created_at FROM bug_report_comments WHERE creator_user_id = ? ORDER BY created_at DESC LIMIT 1",
        [actorUserId]
      );
      const lastCommentAt = recentRows[0]?.created_at ? new Date(recentRows[0].created_at).getTime() : 0;
      const remainingMilliseconds = (config.commentCooldownSeconds * 1000) - (Date.now() - lastCommentAt);
      if (remainingMilliseconds > 0) {
        await connection.rollback();
        await rm(path.join(uploadsRoot, bug.id, id), { recursive: true, force: true });
        const remainingSeconds = Math.ceil(remainingMilliseconds / 1000);
        return { error: `Wait ${remainingSeconds} second${remainingSeconds === 1 ? "" : "s"} before commenting again.`, status: 429 };
      }
    }
    await connection.execute(
      "INSERT INTO bug_report_comments (id, bug_report_id, creator_user_id, content) VALUES (?, ?, ?, ?)",
      [id, bug.id, actorUserId, validated.data.content]
    );
    if (attachment) {
      await connection.execute(
        `INSERT INTO bug_report_comment_attachments
          (id, comment_id, original_name, stored_name, extension, size_bytes, storage_path)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [attachment.id, id, attachment.originalName, attachment.storedName, attachment.extension, attachment.sizeBytes, attachment.storagePath]
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    await rm(path.join(uploadsRoot, bug.id, id), { recursive: true, force: true });
    throw error;
  } finally {
    connection.release();
  }
  return getComment(id);
}

export async function toggleCommentReaction({ publicId, commentId, actorUserId, emoji, bypassLockdown = false, bypassReportLock = false }) {
  const lockdown = await checkLockdownAllowed({ bypassLockdown });
  if (!lockdown.allowed) return { error: lockdown.error, status: 403 };
  await initializeCommentTables();
  const normalizedEmoji = String(emoji ?? "").trim();
  if (!normalizedEmoji || normalizedEmoji.length > 16 || /[\p{L}\p{N}]/u.test(normalizedEmoji)) return { error: "Choose a valid emoji.", status: 400 };
  const bug = await getBug(publicId);
  const comment = await getComment(commentId);
  if (!bug || !comment || comment.bugReportId !== bug.id) return { error: "Comment not found.", status: 404 };
  if (bug.locked && !bypassReportLock) return { error: "This bug report is locked.", status: 403 };
  if (!bug.allow_comments) return { error: "Comments are disabled for this bug report.", status: 403 };
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.execute("SELECT 1 FROM bug_report_comment_reactions WHERE comment_id = ? AND user_id = ? AND emoji = ? FOR UPDATE", [commentId, actorUserId, normalizedEmoji]);
    if (existing.length) {
      await connection.execute("DELETE FROM bug_report_comment_reactions WHERE comment_id = ? AND user_id = ? AND emoji = ?", [commentId, actorUserId, normalizedEmoji]);
    } else {
      const config = await getBugLimitConfig();
      const [countRows] = await connection.execute("SELECT COUNT(*) AS count FROM bug_report_comment_reactions WHERE comment_id = ? AND emoji = ? FOR UPDATE", [commentId, normalizedEmoji]);
      const [typeRows] = await connection.execute("SELECT COUNT(DISTINCT emoji) AS count FROM bug_report_comment_reactions WHERE comment_id = ? FOR UPDATE", [commentId]);
      if (Number(countRows[0].count) >= config.reactionCountLimit) {
        await connection.rollback();
        return { error: "This reaction has reached its user limit.", status: 409 };
      }
      if (Number(typeRows[0].count) >= config.reactionTypeLimit) {
        await connection.rollback();
        return { error: "This comment has reached its different reaction limit.", status: 409 };
      }
      await connection.execute("INSERT INTO bug_report_comment_reactions (comment_id, user_id, emoji) VALUES (?, ?, ?)", [commentId, actorUserId, normalizedEmoji]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  const updated = (await listComments(publicId, actorUserId)).find((item) => item.id === commentId);
  return { reactions: updated?.reactions ?? [] };
}

export async function getComment(commentId, { includeStoragePath = false } = {}) {
  await initializeCommentTables();
  const [rows] = await getPool().execute(`${commentSelect} WHERE c.id = ? LIMIT 1`, [String(commentId ?? "").trim()]);
  const comment = mapComment(rows[0]);
  if (comment && !includeStoragePath && comment.attachment) delete comment.attachment.storagePath;
  return comment;
}

function canChange(comment, actorUserId, canManage) {
  return Boolean(canManage || (comment.creatorUserId && comment.creatorUserId === actorUserId));
}

export async function updateComment({ commentId, actorUserId, canManage = false, bypassLockdown = false, bypassReportLock = false, siteHostname = "", content }) {
  const lockdown = await checkLockdownAllowed({ bypassLockdown });
  if (!lockdown.allowed) return { error: lockdown.error, status: 403 };
  const config = await getBugLimitConfig();
  const validated = validateCommentContent(content, { characterLimit: config.commentCharacterLimit });
  if (validated.error) return { error: validated.error, status: 400 };
  const before = await getComment(commentId);
  if (!before) return { error: "Comment not found.", status: 404 };
  const [reportRows] = await getPool().execute("SELECT locked FROM bug_reports WHERE id = ? LIMIT 1", [before.bugReportId]);
  if (reportRows[0]?.locked && !bypassReportLock) return { error: "This bug report is locked.", status: 403 };
  if (!canChange(before, actorUserId, canManage)) return { error: "Forbidden", status: 403 };
  const moderation = await moderateComment(validated.data, { siteHostname });
  if (!moderation.allowed) return { error: moderation.error, status: 400 };
  await getPool().execute(
    "UPDATE bug_report_comments SET content = ?, edited_at = CURRENT_TIMESTAMP WHERE id = ?",
    [validated.data, commentId]
  );
  return { before, after: await getComment(commentId) };
}

export async function deleteComment({ commentId, actorUserId, canManage = false }) {
  const before = await getComment(commentId, { includeStoragePath: true });
  if (!before) return { error: "Comment not found.", status: 404 };
  if (!canChange(before, actorUserId, canManage)) return { error: "Forbidden", status: 403 };
  await getPool().execute("DELETE FROM bug_report_comments WHERE id = ?", [commentId]);
  if (before.attachment?.storagePath && isCommentStoragePath(before.attachment.storagePath)) {
    await Promise.allSettled([
      unlink(before.attachment.storagePath),
      rm(path.dirname(before.attachment.storagePath), { recursive: true, force: true }),
    ]);
  }
  if (before.attachment) delete before.attachment.storagePath;
  return { before };
}

export async function getCommentAttachment(publicId, commentId, attachmentId) {
  const comment = await getComment(commentId, { includeStoragePath: true });
  if (!comment?.attachment || comment.attachment.id !== attachmentId) return null;
  const bug = await getBug(publicId);
  return bug?.id === comment.bugReportId ? comment.attachment : null;
}

export function isCommentStoragePath(storagePath) {
  const relative = path.relative(uploadsRoot, path.resolve(String(storagePath ?? "")));
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}
