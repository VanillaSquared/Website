export const BUG_REPORT_CATEGORY_CONFIGS = [
  { slug: "vanilla-squared", label: "Mod", order: 1 },
  { slug: "website", label: "Website", order: 2 },
];

export const BUG_REPORT_PRIORITIES = ["Low", "Medium", "High", "Unset"];
export const BUG_REPORT_STATUSES = ["Fixed", "Unconfirmed", "Confirmed", "Works as intended", "Vanilla bug"];

export const MINECRAFT_VERSIONS = ["26.2", "26.1.*", "1.21.11", , "Not applicable"];
export const MOD_VERSIONS = [
  "2.12.1",
  "2.12.0",
  "2.12.0-snapshot.4",
  "2.12.0-snapshot.3.*",
  "2.12.0-snapshot.2",
  "2.12.0-snapshot.1",
  "2.11.2",
  "2.11.1",
  "2.11.0",
  "Not applicable",
];
export const OPERATING_SYSTEMS = ["Windows", "macOS", "Linux", "iOS", "Other", "Not applicable"];

export const BUG_TITLE_MAX_LENGTH = 60;
export const BUG_DESCRIPTION_MAX_LENGTH = 2000;

export const BUG_ATTACHMENT_MAX_FILES = 5;
export const BUG_ATTACHMENT_MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
export const BUG_ATTACHMENT_MAX_TOTAL_SIZE_BYTES = 4 * 1024 * 1024;
export const BUG_ATTACHMENT_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".bmp",
  ".txt",
  ".log",
  ".md",
  ".json",
  ".zip",
  ".gz",
];
export const BUG_ATTACHMENT_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/bmp",
  "text/plain",
  "text/markdown",
  "application/json",
  "application/zip",
  "application/gzip",
  "application/x-gzip",
  "application/x-zip-compressed",
  "application/octet-stream",
];
export const BUG_ATTACHMENT_ACCEPT = BUG_ATTACHMENT_EXTENSIONS.join(",");

// Bug reports are public content. Keep the edge cache long enough to reduce
// function invocations while invalidating the server-side issue cache after a
// successful submission.
export const BUG_CACHE_TTL_SECONDS = 7 * 60;
export const BUG_PUBLIC_CACHE_CONTROL = `public, max-age=${BUG_CACHE_TTL_SECONDS}, s-maxage=${BUG_CACHE_TTL_SECONDS}`;
export const BUG_PREVIEW_MIN_QUERY_LENGTH = 2;
export const BUG_PREVIEW_DEBOUNCE_MS = 600;
