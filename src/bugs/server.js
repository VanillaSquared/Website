import "server-only";

import crypto from "node:crypto";
import { revalidateTag, unstable_cache } from "next/cache";

import {
  BUG_ATTACHMENT_ALLOWED_EXTENSIONS,
  BUG_ATTACHMENT_MAX_BYTES,
  BUG_ATTACHMENT_MAX_FILES,
  BUG_DESCRIPTION_MAX_LENGTH,
  BUG_REPORT_CATEGORY_CONFIGS,
  BUG_REPORT_PRIORITIES,
  BUG_REPORT_STATUSES,
  BUG_TITLE_MAX_LENGTH,
  getBugAttachmentExtension,
  isAllowedBugAttachmentName,
  MINECRAFT_VERSIONS,
  MOD_VERSIONS,
  OPERATING_SYSTEMS,
} from "@/bugs/config";

const GITHUB_OWNER = "VanillaSquared";
const GITHUB_REPOSITORY = "Issues";
const GITHUB_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPOSITORY}`;
const BUGS_CACHE_TAG = "bugs";
const ENVIRONMENT_SEPARATOR = "\n\n---\n\n### Environment\n";
const ATTACHMENTS_SEPARATOR = "\n\n---\n\n### Attachments\n";
const ATTACHMENTS_MARKER_PATTERN = /^<!-- vsq-attachments:([A-Za-z0-9_-]+) -->$/;
const SAFE_STORAGE_ID = /^[A-Za-z0-9_-]{1,64}$/;
const SAFE_STORED_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const ATTACHMENT_MIME_TYPES = Object.freeze({
  txt: "text/plain; charset=utf-8",
  log: "text/plain; charset=utf-8",
  png: "image/png",
  json: "application/json; charset=utf-8",
});

const categoryBySlug = new Map(BUG_REPORT_CATEGORY_CONFIGS.map((category) => [category.slug, category]));
const categoryByLabel = new Map(BUG_REPORT_CATEGORY_CONFIGS.map((category) => [category.label, category]));
const statusLabels = new Map([
  ["Unconfirmed", "Unconfirmed"],
  ["Confirmed", "Confirmed"],
  ["Fixed", "Fixed"],
  ["Intended", "Works as intended"],
  ["Vanilla", "Vanilla bug"],
]);

function githubHeaders(overrides = {}) {
  const token = process.env.github;
  if (!token) throw new Error("Bug storage is not configured.");

  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    ...overrides,
  };
}

async function githubRequest(path, options = {}) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: { ...githubHeaders(), ...options.headers },
  });

  if (!response.ok) {
    const error = new Error("Bug storage request failed.");
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

function safeDisplayName(value) {
  const normalized = String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/]/g, "_")
    .trim();
  return normalized && normalized.length <= 180 ? normalized : null;
}

function attachmentMetadataFromIssueBody(body) {
  const normalizedBody = String(body ?? "");
  const attachmentSectionIndex = normalizedBody.lastIndexOf(ATTACHMENTS_SEPARATOR);
  if (attachmentSectionIndex < 0) return { storageId: "", files: [] };

  const attachmentSection = normalizedBody.slice(attachmentSectionIndex + ATTACHMENTS_SEPARATOR.length).trimEnd();
  const markerLine = attachmentSection.split("\n").at(-1)?.trim() ?? "";
  const match = markerLine.match(ATTACHMENTS_MARKER_PATTERN);
  if (!match) return { storageId: "", files: [] };

  try {
    const parsed = JSON.parse(Buffer.from(match[1], "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object" || !SAFE_STORAGE_ID.test(String(parsed.storageId ?? "")) || !Array.isArray(parsed.files)) {
      return { storageId: "", files: [] };
    }

    const files = parsed.files.slice(0, BUG_ATTACHMENT_MAX_FILES).map((file) => {
      const name = safeDisplayName(file?.name);
      const storedName = String(file?.storedName ?? "");
      const extension = getBugAttachmentExtension(storedName);
      const size = Number(file?.size);

      if (
        !name
        || !SAFE_STORED_NAME.test(storedName)
        || !BUG_ATTACHMENT_ALLOWED_EXTENSIONS.includes(extension)
        || !Number.isFinite(size)
        || size < 0
        || size > BUG_ATTACHMENT_MAX_BYTES
      ) {
        return null;
      }

      return { name, storedName, extension, size };
    }).filter(Boolean);

    return { storageId: String(parsed.storageId), files };
  } catch {
    return { storageId: "", files: [] };
  }
}

function issueToBug(issue) {
  const labels = issue.labels.map((label) => typeof label === "string" ? label : label.name);
  const categoryConfig = labels.map((label) => categoryByLabel.get(label)).find(Boolean);
  const priority = BUG_REPORT_PRIORITIES.find((value) => labels.includes(value)) ?? "Unset";
  const status = [...statusLabels].find(([label]) => labels.includes(label))?.[1] ?? "Unconfirmed";
  const body = String(issue.body ?? "");
  const [description, environment = ""] = body.split(ENVIRONMENT_SEPARATOR, 2);
  const environmentValues = Object.fromEntries(
    [...environment.matchAll(/^- \*\*(Minecraft version|Mod version|Operating system):\*\* (.+)$/gim)]
      .map((match) => [match[1], match[2].trim()])
  );
  const attachmentMetadata = attachmentMetadataFromIssueBody(body);
  const attachments = attachmentMetadata.files.map((attachment) => ({
    ...attachment,
    storageId: attachmentMetadata.storageId,
    url: `/api/bugs/${issue.number}/attachments/${encodeURIComponent(attachment.storedName)}`,
  }));

  return {
    id: String(issue.number),
    publicId: `bug-${issue.number}`,
    title: issue.title,
    category: categoryConfig?.slug ?? "website",
    priority,
    status,
    minecraftVersion: environmentValues["Minecraft version"] ?? "Unknown",
    modVersion: environmentValues["Mod version"] ?? "Unknown",
    operatingSystem: environmentValues["Operating system"] ?? "Unknown",
    createdAt: issue.created_at,
    description: description.trim(),
    source: description.trim(),
    attachments,
  };
}

function issueCommentToBugComment(comment) {
  return {
    id: String(comment.id),
    author: comment.user?.login ?? "Unknown",
    avatarUrl: comment.user?.avatar_url ?? null,
    authorUrl: comment.user?.html_url ?? null,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
    source: String(comment.body ?? "").trim(),
  };
}

const getAllIssues = unstable_cache(async function getAllIssues() {
  const issues = [];

  for (let page = 1; ; page += 1) {
    const batch = await githubRequest(`/issues?state=all&per_page=100&page=${page}`);
    issues.push(...batch.filter((issue) => !issue.pull_request));
    if (batch.length < 100) break;
  }

  return issues.map(issueToBug).sort((left, right) => Number(right.id) - Number(left.id));
}, ["all-bug-reports"], { revalidate: 60, tags: [BUGS_CACHE_TAG] });

function normalizeFilters(value, allowedValues) {
  const values = Array.isArray(value) ? value : [value];
  return [...new Set(values.map((item) => allowedValues.find((allowed) => allowed.toLowerCase() === String(item ?? "").toLowerCase())).filter(Boolean))];
}

export async function listBugReports({ q, category, priority, status } = {}) {
  const query = String(q ?? "").trim().toLowerCase();
  const categories = normalizeFilters(category, [...categoryBySlug.keys()]);
  const priorities = normalizeFilters(priority, BUG_REPORT_PRIORITIES);
  const statuses = normalizeFilters(status, BUG_REPORT_STATUSES);
  const reports = await getAllIssues();

  return reports.filter((report) => (
    (!query || [report.publicId, report.title, report.description].some((value) => value.toLowerCase().includes(query)))
    && (!categories.length || categories.includes(report.category))
    && (!priorities.length || priorities.includes(report.priority))
    && (!statuses.length || statuses.includes(report.status))
  ));
}

export async function getBugReportById(id) {
  if (!/^\d+$/.test(String(id))) return null;

  try {
    const issue = await githubRequest(`/issues/${id}`, {
      next: { revalidate: 60, tags: [BUGS_CACHE_TAG, `${BUGS_CACHE_TAG}-${id}`] },
    });
    return issue.pull_request ? null : issueToBug(issue);
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

export async function getBugReportComments(id) {
  if (!/^\d+$/.test(String(id))) return [];

  const comments = [];

  for (let page = 1; ; page += 1) {
    const batch = await githubRequest(`/issues/${id}/comments?per_page=100&page=${page}`, {
      next: { revalidate: 60, tags: [BUGS_CACHE_TAG, `${BUGS_CACHE_TAG}-${id}`] },
    });
    comments.push(...batch);
    if (batch.length < 100) break;
  }

  return comments.map(issueCommentToBugComment);
}

function requiredString(value, maximum) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized && normalized.length <= maximum ? normalized : null;
}

function allowedChoice(value, choices) {
  return typeof value === "string" && choices.includes(value) ? value : null;
}

export function validateBugSubmission(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;

  const title = requiredString(input.title, BUG_TITLE_MAX_LENGTH);
  const description = requiredString(input.description, BUG_DESCRIPTION_MAX_LENGTH);
  const category = allowedChoice(input.category, [...categoryBySlug.keys()]);
  const minecraftVersion = allowedChoice(input.minecraftVersion, MINECRAFT_VERSIONS);
  const modVersion = allowedChoice(input.modVersion, MOD_VERSIONS);
  const operatingSystem = allowedChoice(input.operatingSystem, OPERATING_SYSTEMS);

  if (!title || !description || !category || !minecraftVersion || !modVersion || !operatingSystem) return null;
  return { title, description, category, minecraftVersion, modVersion, operatingSystem };
}

function hasPngSignature(buffer) {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return buffer.length >= signature.length && signature.every((byte, index) => buffer[index] === byte);
}

export async function prepareBugAttachments(files) {
  if (!Array.isArray(files) || files.length > BUG_ATTACHMENT_MAX_FILES) return null;

  const attachments = [];
  for (const file of files) {
    const name = safeDisplayName(file?.name);
    if (!name || !isAllowedBugAttachmentName(name) || file.size > BUG_ATTACHMENT_MAX_BYTES) return null;

    const extension = getBugAttachmentExtension(name);
    const content = Buffer.from(await file.arrayBuffer());
    if (content.byteLength !== file.size) return null;
    if (extension === "png" && !hasPngSignature(content)) return null;

    attachments.push({ name, extension, size: content.byteLength, content });
  }

  return attachments;
}

function encodedRepositoryPath(...segments) {
  return segments.map((segment) => encodeURIComponent(segment)).join("/");
}

async function uploadBugAttachments(attachments) {
  if (!attachments.length) return { storageId: "", files: [], uploaded: [] };

  const storageId = crypto.randomUUID();
  const uploaded = [];
  const files = [];

  try {
    for (const attachment of attachments) {
      const storedName = `${crypto.randomUUID()}.${attachment.extension}`;
      const path = encodedRepositoryPath("attachments", storageId, storedName);
      const result = await githubRequest(`/contents/${path}`, {
        method: "PUT",
        cache: "no-store",
        body: JSON.stringify({
          message: "Store bug report attachment",
          content: attachment.content.toString("base64"),
        }),
        headers: { "Content-Type": "application/json" },
      });

      uploaded.push({ path, sha: result.content.sha });
      files.push({
        name: attachment.name,
        storedName,
        extension: attachment.extension,
        size: attachment.size,
      });
    }

    return { storageId, files, uploaded };
  } catch (error) {
    await cleanupUploadedAttachments(uploaded);
    throw error;
  }
}

async function cleanupUploadedAttachments(uploaded) {
  for (const { path, sha } of uploaded) {
    try {
      await githubRequest(`/contents/${path}`, {
        method: "DELETE",
        cache: "no-store",
        body: JSON.stringify({ message: "Clean up failed bug report attachment", sha }),
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // Cleanup is best-effort; preserve the original submission error.
    }
  }
}

function encodedAttachmentMarker(storageId, files) {
  if (!files.length) return "";
  const encoded = Buffer.from(JSON.stringify({ storageId, files }), "utf8").toString("base64url");
  const visibleFiles = files.map((file) => `- \`${file.name.replace(/`/g, "'")}\``).join("\n");
  return `${ATTACHMENTS_SEPARATOR}${visibleFiles}\n\n<!-- vsq-attachments:${encoded} -->`;
}

export async function createBugReport(report, attachments = []) {
  const category = categoryBySlug.get(report.category);
  const uploadedAttachments = await uploadBugAttachments(attachments);
  const attachmentSection = encodedAttachmentMarker(uploadedAttachments.storageId, uploadedAttachments.files);
  const body = `${report.description}${ENVIRONMENT_SEPARATOR}\n- **Category:** ${category.label}\n- **Minecraft version:** ${report.minecraftVersion}\n- **Mod version:** ${report.modVersion}\n- **Operating system:** ${report.operatingSystem}${attachmentSection}`;

  try {
    const issue = await githubRequest("/issues", {
      method: "POST",
      cache: "no-store",
      body: JSON.stringify({
        title: report.title,
        body,
        labels: [category.label, "Unset", "Unconfirmed"],
      }),
      headers: { "Content-Type": "application/json" },
    });

    revalidateTag(BUGS_CACHE_TAG, { expire: 0 });
    return issueToBug(issue);
  } catch (error) {
    await cleanupUploadedAttachments(uploadedAttachments.uploaded);
    throw error;
  }
}

export async function getBugAttachment(id, storedName) {
  const bug = await getBugReportById(id);
  if (!bug) return null;

  const attachment = bug.attachments.find((item) => item.storedName === storedName);
  if (!attachment || !SAFE_STORAGE_ID.test(attachment.storageId) || !SAFE_STORED_NAME.test(attachment.storedName)) return null;

  const path = encodedRepositoryPath("attachments", attachment.storageId, attachment.storedName);
  const response = await fetch(`${GITHUB_API}/contents/${path}`, {
    headers: githubHeaders({ Accept: "application/vnd.github.raw+json" }),
    cache: "no-store",
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Bug attachment could not be loaded.");

  return {
    attachment,
    content: Buffer.from(await response.arrayBuffer()),
    mimeType: ATTACHMENT_MIME_TYPES[attachment.extension] ?? "application/octet-stream",
  };
}

export {
  BUG_REPORT_CATEGORY_CONFIGS,
  BUG_REPORT_PRIORITIES,
  BUG_REPORT_STATUSES,
};
