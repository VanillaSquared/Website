import "server-only";

import fs from "node:fs";
import path from "node:path";

import GithubSlugger from "github-slugger";
import matter from "gray-matter";
import { toString } from "mdast-util-to-string";
import remarkParse from "remark-parse";
import { unified } from "unified";

const DOCS_DIRECTORY = path.resolve(process.cwd(), "src", "docs");
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

function titleFromSegment(segment) {
  return segment
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function resolveAssetDataUrl(source) {
  if (!String(source).startsWith("@/assets/")) return null;
  const assetsDirectory = path.resolve(process.cwd(), "src/assets");
  const assetPath = path.resolve(process.cwd(), "src", String(source).slice(2));
  const mimeType = ASSET_MIME_TYPES[path.extname(assetPath).toLowerCase()];
  if (!assetPath.startsWith(`${assetsDirectory}${path.sep}`) || !mimeType || !fs.existsSync(assetPath)) return null;
  return `data:${mimeType};base64,${fs.readFileSync(assetPath).toString("base64")}`;
}

function normalizeSidebarCard(value) {
  if (!value || typeof value !== "object" || value.enabled === false) return null;
  const details = Array.isArray(value.details)
    ? value.details
      .filter((detail) => detail && typeof detail === "object" && detail.label && detail.value !== undefined)
      .map((detail) => ({ label: String(detail.label), value: String(detail.value) }))
    : [];

  return {
    title: String(value.title || "Quick information"),
    description: value.description ? String(value.description) : "",
    image: value.image ? resolveAssetDataUrl(value.image) : null,
    imageAlt: value.imageAlt ? String(value.imageAlt) : "",
    details,
  };
}

function normalizeFrontmatter(data, fallbackSegment) {
  const parsedOrder = Number(data.order);
  return {
    title: String(data.title || titleFromSegment(fallbackSegment)).trim(),
    description: String(data.description || "").trim(),
    order: Number.isFinite(parsedOrder) ? parsedOrder : Number.MAX_SAFE_INTEGER,
    sidebarCard: normalizeSidebarCard(data.sidebarCard),
  };
}

function routeSegments(relativeFile) {
  const parsed = path.parse(relativeFile);
  const directories = parsed.dir ? parsed.dir.split(path.sep) : [];
  if (parsed.name === "index" && !directories.length) return [];
  if (directories.length && parsed.name === directories.at(-1)) return directories;
  if (parsed.name === "index") return directories;
  return [...directories, parsed.name];
}

function extractDocumentDetails(body) {
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

function scanMarkdownFiles(directory, relativeDirectory = "") {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isSymbolicLink()) return [];
    const relative = path.join(relativeDirectory, entry.name);
    const absolute = path.resolve(DOCS_DIRECTORY, relative);
    if (absolute !== DOCS_DIRECTORY && !absolute.startsWith(`${DOCS_DIRECTORY}${path.sep}`)) return [];
    if (entry.isDirectory()) return scanMarkdownFiles(absolute, relative);
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== ".md") return [];
    return [relative];
  });
}

function compareNodes(left, right) {
  return left.order - right.order || left.label.localeCompare(right.label);
}

function makeNavigation(documents) {
  const rootDocument = documents.find((document) => !document.segments.length);
  const root = rootDocument ? [{
    id: rootDocument.path,
    href: rootDocument.path,
    label: rootDocument.title,
    order: rootDocument.order,
  }] : [];
  const directoryNodes = new Map();

  function ensureDirectory(segments) {
    let children = root;
    let currentPath = [];
    let node;
    for (const segment of segments) {
      currentPath = [...currentPath, segment];
      const key = currentPath.join("/");
      node = directoryNodes.get(key);
      if (!node) {
        node = {
          id: `directory:${key}`,
          label: titleFromSegment(segment),
          order: Number.MAX_SAFE_INTEGER,
          children: [],
        };
        directoryNodes.set(key, node);
        children.push(node);
      }
      children = node.children;
    }
    return node;
  }

  for (const document of documents) {
    if (!document.segments.length) continue;
    const parentSegments = document.categoryDocument
      ? document.segments
      : document.segments.slice(0, -1);
    const parent = ensureDirectory(parentSegments);

    if (document.categoryDocument) {
      Object.assign(parent, {
        id: document.path,
        href: document.path,
        label: document.title,
        order: document.order,
      });
    } else {
      const item = {
        id: document.path,
        href: document.path,
        label: document.title,
        order: document.order,
      };
      if (parent) parent.children.push(item);
      else root.push(item);
    }
  }

  function sort(items) {
    items.sort(compareNodes);
    for (const item of items) if (item.children) sort(item.children);
    return items;
  }

  return sort(root);
}

export function getDocsData() {
  const documents = scanMarkdownFiles(DOCS_DIRECTORY).map((relativeFile) => {
    const absoluteFile = path.resolve(DOCS_DIRECTORY, relativeFile);
    const segments = routeSegments(relativeFile);
    if (!segments.every((segment) => SAFE_SEGMENT.test(segment))) {
      throw new Error(`Unsafe documentation path: ${relativeFile}`);
    }

    const source = fs.readFileSync(absoluteFile, "utf8");
    const parsed = matter(source);
    const fallbackSegment = segments.at(-1) || "docs";
    const metadata = normalizeFrontmatter(parsed.data, fallbackSegment);
    const details = extractDocumentDetails(parsed.content);
    const parentDirectory = path.basename(path.dirname(relativeFile));
    const categoryDocument = segments.length > 0 && path.parse(relativeFile).name === parentDirectory;
    const pathname = segments.length ? `/docs/${segments.join("/")}` : "/docs";
    const isDirectoryDocument = categoryDocument || path.parse(relativeFile).name === "index";
    const parentSegments = segments.slice(0, -1);
    const linkBase = isDirectoryDocument
      ? pathname
      : parentSegments.length ? `/docs/${parentSegments.join("/")}` : "/docs";

    return {
      ...metadata,
      ...details,
      source: parsed.content.trim(),
      segments,
      path: pathname,
      linkBase,
      categoryDocument,
    };
  });

  const seen = new Set();
  for (const document of documents) {
    if (seen.has(document.path)) throw new Error(`Duplicate documentation route: ${document.path}`);
    seen.add(document.path);
  }

  return { documents, navigation: makeNavigation(documents) };
}

export function getDocument(slug = []) {
  const segments = Array.isArray(slug) ? slug : [];
  if (!segments.every((segment) => SAFE_SEGMENT.test(segment))) return null;
  const pathname = segments.length ? `/docs/${segments.join("/")}` : "/docs";
  return getDocsData().documents.find((document) => document.path === pathname) ?? null;
}

export function getBreadcrumbs(document) {
  const { documents } = getDocsData();
  const breadcrumbs = [{ title: "Docs", href: "/docs" }];
  if (!document.segments.length) return breadcrumbs;

  for (let index = 1; index <= document.segments.length; index += 1) {
    const href = `/docs/${document.segments.slice(0, index).join("/")}`;
    const match = documents.find((candidate) => candidate.path === href);
    breadcrumbs.push({
      title: match?.title ?? titleFromSegment(document.segments[index - 1]),
      href: match ? href : null,
    });
  }
  return breadcrumbs;
}

export function searchDocuments(query, limit = 20) {
  const terms = String(query).toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const { documents } = getDocsData();

  return documents.map((document) => {
    const breadcrumbs = getBreadcrumbs(document).map((item) => item.title).join(" ");
    const headingText = document.headings.map((heading) => heading.title).join(" ");
    const title = document.title.toLowerCase();
    const searchable = `${document.title} ${document.description} ${breadcrumbs} ${headingText} ${document.text}`.toLowerCase();
    if (!terms.every((term) => searchable.includes(term))) return null;
    const score = terms.reduce((total, term) => total + (title.includes(term) ? 5 : 1), 0);
    return {
      id: document.path,
      href: document.path,
      title: document.title,
      description: document.description || breadcrumbs,
      breadcrumbs,
      score,
    };
  }).filter(Boolean).sort((left, right) => right.score - left.score || left.title.localeCompare(right.title)).slice(0, limit);
}
