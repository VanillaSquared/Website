import "server-only";

import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import {
  extractMarkdownDetails,
  isSafeRouteSegments,
  markdownRouteSegments,
  resolveAssetDataUrl,
  scanMarkdownFiles,
  titleFromSegment,
} from "@/markdown/server";

const DOCS_DIRECTORY = path.resolve(process.cwd(), "src", "docs");

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
    const segments = markdownRouteSegments(relativeFile, { collapseIndex: true });
    if (!isSafeRouteSegments(segments)) {
      throw new Error(`Unsafe documentation path: ${relativeFile}`);
    }

    const source = fs.readFileSync(absoluteFile, "utf8");
    const parsed = matter(source);
    const fallbackSegment = segments.at(-1) || "docs";
    const metadata = normalizeFrontmatter(parsed.data, fallbackSegment);
    const details = extractMarkdownDetails(parsed.content);
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
  if (!isSafeRouteSegments(segments)) return null;
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
