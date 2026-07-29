import "server-only";

import fs from "node:fs";
import path from "node:path";

import GithubSlugger from "github-slugger";
import { toString } from "mdast-util-to-string";
import remarkParse from "remark-parse";
import { unified } from "unified";

const SAFE_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
const ASSET_MIME_TYPES = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};
const parser = unified().use(remarkParse);

export function titleFromSegment(segment) {
  return String(segment)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function isSafeRouteSegments(segments) {
  return Array.isArray(segments) && segments.every((segment) => SAFE_SEGMENT.test(segment));
}

export function resolveAssetDataUrl(source, assetDirectory = "") {
  if (!String(source).startsWith("@/assets/")) return null;

  const assetsDirectory = path.resolve(process.cwd(), "src", "assets", assetDirectory);
  const assetPath = path.resolve(process.cwd(), "src", String(source).slice(2));
  const mimeType = ASSET_MIME_TYPES[path.extname(assetPath).toLowerCase()];
  if (!assetPath.startsWith(`${assetsDirectory}${path.sep}`) || !mimeType || !fs.existsSync(assetPath)) return null;

  return `data:${mimeType};base64,${fs.readFileSync(assetPath).toString("base64")}`;
}

export function scanMarkdownFiles(rootDirectory, directory = rootDirectory, relativeDirectory = "") {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isSymbolicLink()) return [];
    const relative = path.join(relativeDirectory, entry.name);
    const absolute = path.resolve(rootDirectory, relative);
    if (absolute !== rootDirectory && !absolute.startsWith(`${rootDirectory}${path.sep}`)) return [];
    if (entry.isDirectory()) return scanMarkdownFiles(rootDirectory, absolute, relative);
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== ".md") return [];
    return [relative];
  });
}

export function markdownRouteSegments(relativeFile, { collapseIndex = false } = {}) {
  const parsed = path.parse(relativeFile);
  const directories = parsed.dir ? parsed.dir.split(path.sep) : [];
  if (!collapseIndex) return [...directories, parsed.name];
  if (parsed.name === "index") return directories;
  if (directories.length && parsed.name === directories.at(-1)) return directories;
  return [...directories, parsed.name];
}

export function extractMarkdownDetails(body) {
  const tree = parser.parse(body);
  const slugger = new GithubSlugger();
  const headings = [];

  for (const node of tree.children) {
    if (node.type !== "heading") continue;
    const title = toString(node).trim();
    if (!title) continue;
    const id = slugger.slug(title);
    if (node.depth >= 2 && node.depth <= 3) headings.push({ id, title, level: node.depth });
  }

  return {
    headings,
    text: toString(tree).replace(/\s+/g, " ").trim(),
  };
}
