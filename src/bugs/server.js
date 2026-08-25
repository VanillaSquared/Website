import {
  BUG_ATTACHMENT_EXTENSIONS,
  BUG_ATTACHMENT_MAX_FILES,
  BUG_ATTACHMENT_MAX_FILE_SIZE_BYTES,
  BUG_ATTACHMENT_MAX_TOTAL_SIZE_BYTES,
  BUG_ATTACHMENT_MIME_TYPES,
  BUG_PUBLIC_CACHE_CONTROL,
  BUG_CACHE_TTL_SECONDS,
  BUG_DESCRIPTION_MAX_LENGTH,
  BUG_REPORT_CATEGORY_CONFIGS,
  BUG_REPORT_PRIORITIES,
  BUG_REPORT_STATUSES,
  BUG_TITLE_MAX_LENGTH,
  MINECRAFT_VERSIONS,
  MOD_VERSIONS,
  OPERATING_SYSTEMS,
} from "@/bugs/config";

const GITHUB_OWNER = "VanillaSquared";
const GITHUB_REPOSITORY = "Issues";
const GITHUB_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPOSITORY}`;
const GITHUB_UPLOADS = "https://uploads.github.com";
const ENVIRONMENT_SEPARATOR = "\n\n---\n\n### Environment\n";
const ATTACHED_ASSETS_SEPARATOR = "\n\n<!-- Attached Assets -->\n\n";

const categoryBySlug = new Map(BUG_REPORT_CATEGORY_CONFIGS.map((category) => [category.slug, category]));
const categoryByLabel = new Map(BUG_REPORT_CATEGORY_CONFIGS.map((category) => [category.label, category]));
const BUGS_CACHE_TTL_MS = BUG_CACHE_TTL_SECONDS * 1000;
let allIssuesCache = null;
let allIssuesCacheExpiresAt = 0;
let allIssuesRequest = null;
let allIssuesRequestGeneration = 0;
let allIssuesCacheGeneration = 0;
const statusLabels = new Map([
  ["Unconfirmed", "Unconfirmed"],
  ["Confirmed", "Confirmed"],
  ["Fixed", "Fixed"],
  ["Intended", "Works as intended"],
  ["Vanilla", "Vanilla bug"],
]);

function githubHeaders() {
  const token = process.env.github;
  if (!token) throw new Error("Bug storage is not configured.");

  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
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
  return response.json();
}

async function githubUploadRequest(path, options = {}) {
  const response = await fetch(`${GITHUB_UPLOADS}${path}`, {
    ...options,
    headers: { ...githubHeaders(), ...options.headers },
  });

  if (!response.ok) {
    const error = new Error("Bug attachment upload failed.");
    error.status = response.status;
    throw error;
  }
  return response.json();
}

function issueToBug(issue) {
  const labels = issue.labels.map((label) => typeof label === "string" ? label : label.name);
  const categoryConfig = labels.map((label) => categoryByLabel.get(label)).find(Boolean);
  const priority = BUG_REPORT_PRIORITIES.find((value) => labels.includes(value)) ?? "Unset";
  const status = [...statusLabels].find(([label]) => labels.includes(label))?.[1] ?? "Unconfirmed";
  const [description, environment = ""] = String(issue.body ?? "").split(ENVIRONMENT_SEPARATOR, 2);
  const [environmentDetails, attachedAssets = ""] = environment.split(ATTACHED_ASSETS_SEPARATOR, 2);
  const environmentValues = Object.fromEntries(
    [...environmentDetails.matchAll(/^- \*\*(Minecraft version|Mod version|Operating system):\*\* (.+)$/gim)]
      .map((match) => [match[1], match[2].trim()])
  );
  const normalizedDescription = description.trim();
  const source = [normalizedDescription, attachedAssets.trim()].filter(Boolean).join("\n\n");

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
    description: normalizedDescription,
    source,
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

async function getAllIssues() {
  if (allIssuesCache && Date.now() < allIssuesCacheExpiresAt) return allIssuesCache;

  if (allIssuesRequest && allIssuesRequestGeneration === allIssuesCacheGeneration) return allIssuesRequest;

  const requestGeneration = allIssuesCacheGeneration;

  allIssuesRequest = (async () => {
    const issues = [];

    for (let page = 1; ; page += 1) {
      const batch = await githubRequest(`/issues?state=all&per_page=100&page=${page}`);
      issues.push(...batch.filter((issue) => !issue.pull_request));
      if (batch.length < 100) break;
    }

    const reports = issues.map(issueToBug).sort((left, right) => Number(right.id) - Number(left.id));
    if (requestGeneration === allIssuesCacheGeneration) {
      allIssuesCache = reports;
      allIssuesCacheExpiresAt = Date.now() + BUGS_CACHE_TTL_MS;
    }
    return reports;
  })();
  allIssuesRequestGeneration = requestGeneration;

  try {
    return await allIssuesRequest;
  } finally {
    if (allIssuesRequestGeneration === requestGeneration) allIssuesRequest = null;
  }
}

function invalidateBugReportsCache() {
  allIssuesCache = null;
  allIssuesCacheExpiresAt = 0;
  allIssuesCacheGeneration += 1;
}

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
    const issue = await githubRequest(`/issues/${id}`);
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
    const batch = await githubRequest(`/issues/${id}/comments?per_page=100&page=${page}`);
    comments.push(...batch);
    if (batch.length < 100) break;
  }

  return comments.map(issueCommentToBugComment);
}

function requiredString(value, maximum) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized && normalized.length <= maximum ? normalized : null;
}

function isFileLike(value) {
  return value
    && typeof value === "object"
    && typeof value.name === "string"
    && Number.isSafeInteger(value.size)
    && value.size >= 0
    && typeof value.arrayBuffer === "function";
}

function attachmentExtension(name) {
  const fileName = name.split(/[\\/]/).pop() ?? "";
  return fileName.match(/\.[a-z0-9]+$/i)?.[0].toLowerCase() ?? "";
}

export function validateBugAttachments(files) {
  if (!Array.isArray(files)) return null;

  const attachments = [];
  for (const file of files) {
    if (isFileLike(file) && file.name === "" && file.size === 0) continue;
    if (!isFileLike(file) || !file.name.trim() || file.size > BUG_ATTACHMENT_MAX_FILE_SIZE_BYTES) return null;

    const extension = attachmentExtension(file.name);
    if (!BUG_ATTACHMENT_EXTENSIONS.includes(extension)) return null;

    const mimeType = String(file.type ?? "").toLowerCase().split(";", 1)[0];
    if (mimeType && !BUG_ATTACHMENT_MIME_TYPES.includes(mimeType)) return null;
    attachments.push(file);
  }

  if (attachments.length > BUG_ATTACHMENT_MAX_FILES) return null;
  const totalSize = attachments.reduce((total, file) => total + file.size, 0);
  return totalSize <= BUG_ATTACHMENT_MAX_TOTAL_SIZE_BYTES ? attachments : null;
}

function safeAttachmentName(name, index) {
  const fileName = name.split(/[\\/]/).pop() ?? "attachment";
  const extension = attachmentExtension(fileName);
  const stem = fileName
    .slice(0, -extension.length)
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "attachment";

  return `${String(index + 1).padStart(2, "0")}-${stem}${extension}`;
}

const attachmentContentTypes = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
  [".bmp", "image/bmp"],
  [".txt", "text/plain"],
  [".log", "text/x-log"],
  [".md", "text/markdown"],
  [".json", "application/json"],
  [".zip", "application/zip"],
  [".gz", "application/gzip"],
]);

function attachmentContentType(file) {
  return attachmentContentTypes.get(attachmentExtension(file.name)) ?? "application/octet-stream";
}

function githubAttachmentUrl(value) {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && url.hostname === "github.com"
      && url.pathname.startsWith("/user-attachments/")
      ? value
      : null;
  } catch {
    return null;
  }
}

async function uploadBugAttachments(files) {
  if (!files.length) return [];

  const repository = await githubRequest("", { cache: "no-store" });
  if (!Number.isSafeInteger(repository?.id) || repository.id <= 0) throw new Error("Bug repository lookup failed.");

  const assets = [];
  for (const [index, file] of files.entries()) {
    const fileName = safeAttachmentName(file.name, index);
    const contentType = attachmentContentType(file);
    const query = new URLSearchParams({
      name: fileName,
      content_type: contentType,
      repository_id: String(repository.id),
    });
    const response = await githubUploadRequest(`/user-attachments/assets?${query}`, {
      method: "POST",
      cache: "no-store",
      body: Buffer.from(await file.arrayBuffer()),
      headers: { Accept: "application/json", "Content-Type": contentType },
    });
    const url = githubAttachmentUrl(response?.url);
    if (!url) throw new Error("Bug attachment upload failed.");

    assets.push({ name: fileName, url, contentType });
  }

  return assets;
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

export async function createBugReport(report, attachments = []) {
  const category = categoryBySlug.get(report.category);
  const assets = await uploadBugAttachments(attachments);
  const attachedAssets = assets.length
    ? `${ATTACHED_ASSETS_SEPARATOR}${assets.map(({ name, url, contentType }) => `- ${contentType.startsWith("image/") ? `![${name}](${url})` : `[${name}](${url})`}`).join("\n")}`
    : "";
  const body = `${report.description}${ENVIRONMENT_SEPARATOR}\n- **Category:** ${category.label}\n- **Minecraft version:** ${report.minecraftVersion}\n- **Mod version:** ${report.modVersion}\n- **Operating system:** ${report.operatingSystem}${attachedAssets}`;
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

  invalidateBugReportsCache();
  return issueToBug(issue);
}

export {
  BUG_PUBLIC_CACHE_CONTROL,
  BUG_REPORT_CATEGORY_CONFIGS,
  BUG_REPORT_PRIORITIES,
  BUG_REPORT_STATUSES,
};
