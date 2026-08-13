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

export const BUG_ATTACHMENT_ALLOWED_EXTENSIONS = ["txt", "log", "png", "json"];
export const BUG_ATTACHMENT_MAX_FILES = 4;
export const BUG_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const BUG_ATTACHMENT_MAX_TOTAL_BYTES = 10 * 1024 * 1024;

export function getBugAttachmentExtension(name) {
  const normalizedName = String(name ?? "").trim();
  const dotIndex = normalizedName.lastIndexOf(".");
  return dotIndex > -1 ? normalizedName.slice(dotIndex + 1).toLowerCase() : "";
}

export function isAllowedBugAttachmentName(name) {
  return BUG_ATTACHMENT_ALLOWED_EXTENSIONS.includes(getBugAttachmentExtension(name));
}
