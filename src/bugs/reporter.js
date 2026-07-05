import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { getPool, initializeUsersTable } from "@/auth/openSQL";

export const BUG_REPORT_CATEGORIES = [
  "Gameplay",
  "Launcher",
  "Website",
  "Account",
  "Performance",
  "Crash",
  "Other",
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

export async function initializeBugReporterTables() {
  if (!bugReporterInitialized) {
    bugReporterInitialized = (async () => {
      try {
        await initializeUsersTable();

        await getPool().query(`
          CREATE TABLE IF NOT EXISTS bug_reports (
            id CHAR(36) PRIMARY KEY,
            creator_user_id CHAR(36) NOT NULL,
            category VARCHAR(64) NOT NULL,
            title VARCHAR(160) NOT NULL,
            description TEXT NOT NULL,
            fixed BOOLEAN NOT NULL DEFAULT FALSE,
            affected_versions JSON NOT NULL,
            fixed_version VARCHAR(64) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT bug_reports_creator_user_id_fk FOREIGN KEY (creator_user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);

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
  const fixed = getString(formData, "fixed") === "true";
  const affectedVersions = [...new Set(getAllStrings(formData, "affectedVersions"))];
  const fixedVersion = fixed ? getString(formData, "fixedVersion") : null;
  const files = formData.getAll("files").filter((file) => isFileLike(file) && file.size > 0);

  if (!BUG_REPORT_CATEGORIES.includes(category)) {
    return { error: "Choose a valid bug report category." };
  }

  if (!title || title.length > MAX_TITLE_LENGTH) {
    return { error: `Enter a title between 1 and ${MAX_TITLE_LENGTH} characters.` };
  }

  if (!description || description.length > MAX_DESCRIPTION_LENGTH) {
    return { error: `Enter a description between 1 and ${MAX_DESCRIPTION_LENGTH} characters.` };
  }

  if (!affectedVersions.length || affectedVersions.some((version) => !BUG_REPORT_VERSIONS.includes(version))) {
    return { error: "Choose at least one valid affected version." };
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
      fixed,
      affectedVersions,
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

  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO bug_reports (id, creator_user_id, category, title, description, fixed, affected_versions, fixed_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
      [
        id,
        creatorUserId,
        report.category,
        report.title,
        report.description,
        report.fixed,
        JSON.stringify(report.affectedVersions),
        report.fixedVersion,
      ]
    );

    for (const file of files) {
      await connection.execute(
        `INSERT INTO bug_report_files (id, bug_report_id, original_name, stored_name, extension, size_bytes, storage_path)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [file.id, id, file.originalName, file.storedName, file.extension, file.sizeBytes, file.storagePath]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return { id };
}
