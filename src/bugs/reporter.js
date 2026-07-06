import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { getPool, initializeUsersTable } from "@/auth/openSQL";

export const BUG_REPORT_CATEGORY_CONFIGS = [
  { slug: "vanilla-squared", label: "Vanilla Squared", shortening: "vsq", order: 1 },
  { slug: "website", label: "Website", shortening: "web", order: 2 },
  { slug: "test", label: "Test", shortening: "dev", order: 3 },
];

export const BUG_REPORT_CATEGORIES = BUG_REPORT_CATEGORY_CONFIGS.map((category) => category.slug);
export const BUG_REPORT_PRIORITIES = ["Low", "Medium", "High", "Code Red", "unset"];
export const BUG_REPORT_STATUSES = [
  "Fixed",
  "Unfixable",
  "Unconfirmed",
  "Confirmed",
  "Works as intended",
  "Vanilla bug",
];

export const BUG_REPORT_VERSIONS = [
  "1.21.4",
  "1.21.3",
  "1.21.1",
  "1.20.6",
  "1.20.4",
  "Website",
  "Unknown",
];

export const BUG_REPORT_ALLOWED_EXTENSIONS = [".log", ".png", ".txt", ".json", ".html"];
export const BUG_REPORT_MAX_FILE_SIZE = 10 * 1024 * 1024;
export const BUG_REPORT_MAX_FILES = 3;

const MAX_TITLE_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 8000;
const uploadsRoot = path.join(process.cwd(), ".data", "bug-reports");
let bugReporterInitialized;
let bugReporterSeeded;

export function getBugReportCategoryConfig(slug) {
  return BUG_REPORT_CATEGORY_CONFIGS.find((category) => category.slug === slug) ?? null;
}

async function runSchemaUpdate(sql) {
  try {
    await getPool().query(sql);
  } catch (error) {
    if (!["ER_DUP_FIELDNAME", "ER_DUP_KEYNAME", "ER_CANT_DROP_FIELD_OR_KEY"].includes(error.code)) {
      throw error;
    }
  }
}

export async function initializeBugReporterTables() {
  if (!bugReporterInitialized) {
    bugReporterInitialized = (async () => {
      try {
        await initializeUsersTable();

        await getPool().query(`
          CREATE TABLE IF NOT EXISTS bug_reports (
            id CHAR(36) PRIMARY KEY,
            public_id VARCHAR(32) NULL UNIQUE,
            creator_user_id CHAR(36) NOT NULL,
            category VARCHAR(64) NOT NULL,
            category_shortening VARCHAR(16) NULL,
            category_sequence INT UNSIGNED NULL,
            title VARCHAR(160) NOT NULL,
            description TEXT NOT NULL,
            priority VARCHAR(32) NOT NULL DEFAULT 'unset',
            status VARCHAR(64) NOT NULL DEFAULT 'Unconfirmed',
            fixed BOOLEAN NOT NULL DEFAULT FALSE,
            affected_versions JSON NULL,
            fixed_version VARCHAR(64) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT bug_reports_creator_user_id_fk FOREIGN KEY (creator_user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY bug_reports_category_sequence_unique (category, category_sequence)
          )
        `);

        await runSchemaUpdate("ALTER TABLE bug_reports ADD COLUMN public_id VARCHAR(32) NULL UNIQUE AFTER id");
        await runSchemaUpdate("ALTER TABLE bug_reports ADD COLUMN category_shortening VARCHAR(16) NULL AFTER category");
        await runSchemaUpdate("ALTER TABLE bug_reports ADD COLUMN category_sequence INT UNSIGNED NULL AFTER category_shortening");
        await runSchemaUpdate("ALTER TABLE bug_reports ADD COLUMN priority VARCHAR(32) NOT NULL DEFAULT 'unset' AFTER description");
        await runSchemaUpdate("ALTER TABLE bug_reports ADD COLUMN status VARCHAR(64) NOT NULL DEFAULT 'Unconfirmed' AFTER priority");
        await runSchemaUpdate("ALTER TABLE bug_reports ADD UNIQUE KEY bug_reports_category_sequence_unique (category, category_sequence)");
        await runSchemaUpdate("ALTER TABLE bug_reports MODIFY affected_versions JSON NULL");

        await getPool().query(`
          CREATE TABLE IF NOT EXISTS bug_report_counters (
            category VARCHAR(64) PRIMARY KEY,
            next_sequence INT UNSIGNED NOT NULL
          )
        `);

        for (const category of BUG_REPORT_CATEGORY_CONFIGS) {
          await getPool().execute(
            `INSERT INTO bug_report_counters (category, next_sequence)
             SELECT ?, COALESCE(MAX(category_sequence), 0) + 1 FROM bug_reports WHERE category = ?
             ON DUPLICATE KEY UPDATE next_sequence = GREATEST(next_sequence, VALUES(next_sequence))`,
            [category.slug, category.slug]
          );
        }

        await getPool().query(`
          CREATE TABLE IF NOT EXISTS bug_report_files (
            id CHAR(36) PRIMARY KEY,
            bug_report_id CHAR(36) NOT NULL,
            original_name VARCHAR(255) NOT NULL,
            stored_name VARCHAR(255) NOT NULL,
            extension VARCHAR(16) NOT NULL,
            size_bytes INT UNSIGNED NOT NULL,
            storage_path VARCHAR(512) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT bug_report_files_bug_report_id_fk FOREIGN KEY (bug_report_id) REFERENCES bug_reports(id) ON DELETE CASCADE
          )
        `);
      } catch (error) {
        bugReporterInitialized = undefined;
        throw error;
      }
    })();
  }

  await bugReporterInitialized;
}

async function ensureDemoBugReporterUser(connection = getPool()) {
  const id = "00000000-0000-4000-8000-000000000001";
  await connection.execute(
    "INSERT IGNORE INTO users (id, username, email) VALUES (?, ?, ?)",
    [id, "bug-reporter-system", "bug-reporter-system@vanillasquared.local"]
  );

  return id;
}

async function insertBugReportWithGeneratedId(connection, { id = randomUUID(), creatorUserId, category, title, description, priority = "unset", status = "Unconfirmed" }) {
  const categoryConfig = getBugReportCategoryConfig(category);

  if (!categoryConfig) {
    throw new Error(`Unknown bug category: ${category}`);
  }

  await connection.execute(
    "INSERT IGNORE INTO bug_report_counters (category, next_sequence) VALUES (?, 1)",
    [category]
  );

  const [counterRows] = await connection.execute(
    "SELECT next_sequence FROM bug_report_counters WHERE category = ? FOR UPDATE",
    [category]
  );
  const sequence = counterRows[0]?.next_sequence ?? 1;
  const publicId = `${categoryConfig.shortening}-${sequence}`;

  await connection.execute(
    "UPDATE bug_report_counters SET next_sequence = ? WHERE category = ?",
    [sequence + 1, category]
  );

  await connection.execute(
    `INSERT INTO bug_reports
      (id, public_id, creator_user_id, category, category_shortening, category_sequence, title, description, priority, status, affected_versions)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, publicId, creatorUserId, category, categoryConfig.shortening, sequence, title, description, priority, status, JSON.stringify(["Unknown"])]
  );

  return { id, publicId };
}

export async function seedDemoBugReports() {
  await initializeBugReporterTables();

  if (!bugReporterSeeded) {
    bugReporterSeeded = (async () => {
      const [[{ count }]] = await getPool().query("SELECT COUNT(*) AS count FROM bug_reports");
      const demos = [
        {
          category: "vanilla-squared",
          title: "Spawn guide book can duplicate on first join",
          description: "New players sometimes receive two guide books when their first join event retries after a reconnect.\n\nSteps to reproduce:\n1. Join the server with a fresh player profile.\n2. Disconnect during the first-join setup while the guide book is being created.\n3. Reconnect before the previous join attempt fully finishes.\n\nExpected result: the player keeps one guide book.\nActual result: the retry can grant a second copy, leaving duplicate starter items in the inventory.",
          priority: "Medium",
          status: "Confirmed",
        },
        {
          category: "website",
          title: "Components page search loses focus after submit",
          description: "Submitting a search on the components page reloads correctly, but the input is no longer focused afterwards.",
          priority: "Low",
          status: "Unconfirmed",
        },
        {
          category: "test",
          title: "Development seed entry for filter sidebar testing",
          description: "Demo report used to verify category grouping, URL filters, and right-side filter sidebar behavior.",
          priority: "unset",
          status: "Works as intended",
        },
        {
          category: "vanilla-squared",
          title: "Nether portal cooldown occasionally persists",
          description: "A player can remain on portal cooldown after changing dimensions during server lag spikes. The player exits the portal successfully, but the cooldown state remains active long enough that walking back into a portal does nothing.\n\nThis seems most visible when TPS drops during chunk generation or when several players use portals at the same time. Relogging clears the state, so it is likely not persisted permanently, but it is confusing in normal gameplay because there is no visible timer or message explaining why the portal is not responding.",
          priority: "High",
          status: "Confirmed",
        },
        {
          category: "vanilla-squared",
          title: "Villager trade restock message repeats",
          description: "The restock notification can fire multiple times for the same villager in busy trading halls.",
          priority: "Low",
          status: "Unconfirmed",
        },
        {
          category: "vanilla-squared",
          title: "Claim border particles render too far away",
          description: "Claim visualization particles are visible from neighboring areas instead of only near the selected claim.",
          priority: "Medium",
          status: "Confirmed",
        },
        {
          category: "vanilla-squared",
          title: "Custom recipe unlock toast appears twice",
          description: "Some custom recipe unlocks trigger duplicate toast notifications after reconnecting.",
          priority: "Low",
          status: "Unconfirmed",
        },
        {
          category: "vanilla-squared",
          title: "Mob cap overlay shows stale values",
          description: "The overlay can show a cached mob cap value for several seconds after moving between regions.",
          priority: "Medium",
          status: "Unconfirmed",
        },
        {
          category: "website",
          title: "Mobile navigation spacing is uneven",
          description: "Header actions can appear cramped on narrow screens when the auth button and search are both visible.",
          priority: "Low",
          status: "Confirmed",
        },
        {
          category: "website",
          title: "Login callback error page lacks retry action",
          description: "OAuth failures show an error but do not provide an obvious way to retry the login flow.",
          priority: "Medium",
          status: "Unconfirmed",
        },
        {
          category: "website",
          title: "Footer overlaps short dynamic pages",
          description: "Some short server-rendered pages leave the footer visually too close to primary content.",
          priority: "Low",
          status: "Fixed",
        },
        {
          category: "website",
          title: "Search preview result text truncates too early",
          description: "Long result titles can truncate before using available space in the preview dropdown.",
          priority: "Low",
          status: "Confirmed",
        },
        {
          category: "website",
          title: "Settings modal focus state is inconsistent",
          description: "Keyboard focus styles differ between settings navigation items and regular buttons.",
          priority: "Medium",
          status: "Unconfirmed",
        },
        {
          category: "test",
          title: "Synthetic scrolling test report alpha",
          description: "Seed report used to ensure long lists scroll smoothly while preserving tight row hit targets.",
          priority: "unset",
          status: "Works as intended",
        },
        {
          category: "test",
          title: "Synthetic scrolling test report beta",
          description: "Seed report used to validate search previews and category ordering with multiple rows.",
          priority: "Low",
          status: "Works as intended",
        },
        {
          category: "test",
          title: "Synthetic filter state persistence test",
          description: "Seed report used to confirm that URL filters persist while searching from either search bar.",
          priority: "Medium",
          status: "Works as intended",
        },
        {
          category: "test",
          title: "Synthetic code red display test",
          description: "Seed report used to verify high-contrast Code Red priority tags in the reusable tag component.",
          priority: "Code Red",
          status: "Unfixable",
        },
        {
          category: "test",
          title: "Synthetic vanilla bug status test",
          description: "Seed report used to verify the Vanilla bug status appears correctly in lists and previews.",
          priority: "High",
          status: "Vanilla bug",
        },
      ];

      if (Number(count) >= demos.length) {
        return;
      }

      const connection = await getPool().getConnection();

      try {
        await connection.beginTransaction();
        const creatorUserId = await ensureDemoBugReporterUser(connection);

        for (const demo of demos.slice(Number(count))) {
          await insertBugReportWithGeneratedId(connection, { creatorUserId, ...demo });
        }

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        bugReporterSeeded = undefined;
        throw error;
      } finally {
        connection.release();
      }
    })();
  }

  await bugReporterSeeded;
}

function getString(formData, name) {
  return String(formData.get(name) ?? "").trim();
}

function getAllStrings(formData, name) {
  return formData.getAll(name).map((value) => String(value).trim()).filter(Boolean);
}

function getSafeOriginalName(name) {
  return path.basename(String(name ?? "attachment")).slice(0, 255) || "attachment";
}

function getExtension(name) {
  return path.extname(name).toLowerCase();
}

function isFileLike(value) {
  return value && typeof value === "object" && typeof value.arrayBuffer === "function";
}

export function validateBugReportFormData(formData) {
  const category = getString(formData, "category");
  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const priority = getString(formData, "priority") || "unset";
  const status = getString(formData, "status") || "Unconfirmed";
  const fixed = getString(formData, "fixed") === "true";
  const affectedVersions = [...new Set(getAllStrings(formData, "affectedVersions"))];
  const fixedVersion = fixed ? getString(formData, "fixedVersion") : null;
  const files = formData.getAll("files").filter((file) => isFileLike(file) && file.size > 0);

  if (!BUG_REPORT_CATEGORIES.includes(category)) {
    return { error: "Choose a valid bug report category." };
  }

  if (!BUG_REPORT_PRIORITIES.includes(priority)) {
    return { error: "Choose a valid bug report priority." };
  }

  if (!BUG_REPORT_STATUSES.includes(status)) {
    return { error: "Choose a valid bug report status." };
  }

  if (!title || title.length > MAX_TITLE_LENGTH) {
    return { error: `Enter a title between 1 and ${MAX_TITLE_LENGTH} characters.` };
  }

  if (!description || description.length > MAX_DESCRIPTION_LENGTH) {
    return { error: `Enter a description between 1 and ${MAX_DESCRIPTION_LENGTH} characters.` };
  }

  if (affectedVersions.some((version) => !BUG_REPORT_VERSIONS.includes(version))) {
    return { error: "Choose valid affected versions." };
  }

  if (fixed && !BUG_REPORT_VERSIONS.includes(fixedVersion)) {
    return { error: "Choose a valid fixed version." };
  }

  if (files.length > BUG_REPORT_MAX_FILES) {
    return { error: `Upload up to ${BUG_REPORT_MAX_FILES} files.` };
  }

  for (const file of files) {
    const originalName = getSafeOriginalName(file.name);
    const extension = getExtension(originalName);

    if (!BUG_REPORT_ALLOWED_EXTENSIONS.includes(extension)) {
      return { error: "Attachments must be .log, .png, .txt, .json, or .html files." };
    }

    if (file.size > BUG_REPORT_MAX_FILE_SIZE) {
      return { error: "Each attachment must be 10 MB or smaller." };
    }
  }

  return {
    data: {
      category,
      title,
      description,
      priority,
      status,
      fixed,
      affectedVersions: affectedVersions.length ? affectedVersions : ["Unknown"],
      fixedVersion,
      files,
    },
  };
}

async function saveBugReportFiles(reportId, files) {
  const reportDirectory = path.join(uploadsRoot, reportId);
  await mkdir(reportDirectory, { recursive: true });

  const savedFiles = [];

  for (const file of files) {
    const id = randomUUID();
    const originalName = getSafeOriginalName(file.name);
    const extension = getExtension(originalName);
    const storedName = `${id}${extension}`;
    const storagePath = path.join(reportDirectory, storedName);

    await writeFile(storagePath, Buffer.from(await file.arrayBuffer()), { flag: "wx" });

    savedFiles.push({
      id,
      originalName,
      storedName,
      extension,
      sizeBytes: file.size,
      storagePath,
    });
  }

  return savedFiles;
}

export async function createBugReport({ creatorUserId, formData }) {
  const validated = validateBugReportFormData(formData);

  if (validated.error) {
    return { error: validated.error };
  }

  await initializeBugReporterTables();

  const report = validated.data;
  const id = randomUUID();
  const files = await saveBugReportFiles(id, report.files);
  const connection = await getPool().getConnection();
  let created;

  try {
    await connection.beginTransaction();
    created = await insertBugReportWithGeneratedId(connection, {
      id,
      creatorUserId,
      category: report.category,
      title: report.title,
      description: report.description,
      priority: report.priority,
      status: report.status,
    });

    for (const file of files) {
      await connection.execute(
        `INSERT INTO bug_report_files (id, bug_report_id, original_name, stored_name, extension, size_bytes, storage_path)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [file.id, created.id, file.originalName, file.storedName, file.extension, file.sizeBytes, file.storagePath]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return created;
}

function parseJsonArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value) {
    return [];
  }

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapBugReportRow(row) {
  return {
    id: row.id,
    publicId: row.public_id,
    category: row.category,
    categoryShortening: row.category_shortening,
    categorySequence: row.category_sequence,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    fixed: Boolean(row.fixed),
    affectedVersions: parseJsonArray(row.affected_versions),
    fixedVersion: row.fixed_version,
    creatorUserId: row.creator_user_id,
    creatorUsername: row.creator_username,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBugReportFileRow(row) {
  return {
    id: row.id,
    originalName: row.original_name,
    extension: row.extension,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
  };
}

export async function listBugReports({ q, category, priority, status, seed = true } = {}) {
  if (seed) {
    await seedDemoBugReports();
  } else {
    await initializeBugReporterTables();
  }

  const where = [];
  const params = [];

  if (q) {
    where.push("(public_id LIKE ? OR title LIKE ? OR description LIKE ?)");
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  if (category && BUG_REPORT_CATEGORIES.includes(category)) {
    where.push("category = ?");
    params.push(category);
  }

  if (priority && BUG_REPORT_PRIORITIES.includes(priority)) {
    where.push("priority = ?");
    params.push(priority);
  }

  if (status && BUG_REPORT_STATUSES.includes(status)) {
    where.push("status = ?");
    params.push(status);
  }

  const orderCase = BUG_REPORT_CATEGORY_CONFIGS.map((config) => `WHEN category = '${config.slug}' THEN ${config.order}`).join(" ");
  const [rows] = await getPool().execute(
    `SELECT bug_reports.id, public_id, category, category_shortening, category_sequence, title, description, priority, status, fixed, affected_versions, fixed_version, creator_user_id, users.username AS creator_username, bug_reports.created_at, bug_reports.updated_at
     FROM bug_reports
     INNER JOIN users ON users.id = bug_reports.creator_user_id
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY CASE ${orderCase} ELSE 99 END, category_sequence ASC, bug_reports.created_at ASC`,
    params
  );

  return rows.map(mapBugReportRow);
}

export async function getBugReportByPublicId(publicId, { seed = true } = {}) {
  const normalizedPublicId = String(publicId ?? "").trim();

  if (!normalizedPublicId) {
    return null;
  }

  if (seed) {
    await seedDemoBugReports();
  } else {
    await initializeBugReporterTables();
  }

  const [rows] = await getPool().execute(
    `SELECT bug_reports.id, public_id, category, category_shortening, category_sequence, title, description, priority, status, fixed, affected_versions, fixed_version, creator_user_id, users.username AS creator_username, bug_reports.created_at, bug_reports.updated_at
     FROM bug_reports
     INNER JOIN users ON users.id = bug_reports.creator_user_id
     WHERE LOWER(public_id) = LOWER(?)
     LIMIT 1`,
    [normalizedPublicId]
  );

  if (!rows.length) {
    return null;
  }

  const bug = mapBugReportRow(rows[0]);
  const [fileRows] = await getPool().execute(
    `SELECT id, original_name, extension, size_bytes, created_at
     FROM bug_report_files
     WHERE bug_report_id = ?
     ORDER BY created_at ASC`,
    [bug.id]
  );

  return {
    ...bug,
    files: fileRows.map(mapBugReportFileRow),
  };
}
