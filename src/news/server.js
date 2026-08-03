import "server-only";

import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import {
  isSafeRouteSegments,
  markdownRouteSegments,
  parseFrontmatterDate,
  resolveAssetUrl,
  scanMarkdownFiles,
  titleFromSegment,
} from "@/markdown/server";

const NEWS_DIRECTORY = path.resolve(process.cwd(), "src", "news");

export const NEWS_TAGS = Object.freeze({
  patchnotes: { label: "Patch notes" },
  announcement: { label: "Announcement" },
  other: { label: "Other" },
});

function normalizeTags(value, relativeFile) {
  const names = String(value || "other")
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
  const uniqueNames = [...new Set(names.length ? names : ["other"])];

  for (const name of uniqueNames) {
    if (!Object.hasOwn(NEWS_TAGS, name)) {
      throw new Error(`Invalid news tag "${name}" in ${relativeFile}. Expected one or more of: ${Object.keys(NEWS_TAGS).join(", ")}.`);
    }
  }

  return uniqueNames.map((name) => ({ name, label: NEWS_TAGS[name].label }));
}

function normalizeFrontmatter(data, relativeFile, fallbackSegment) {
  const tags = normalizeTags(data.tag, relativeFile);
  const publishedDate = parseFrontmatterDate(data.published_date, "published_date", relativeFile);
  if (data.showImageOnPage !== undefined && typeof data.showImageOnPage !== "boolean") {
    throw new Error(`Invalid showImageOnPage value in ${relativeFile}. Expected true or false.`);
  }

  if (data.authorLink !== undefined && typeof data.authorLink !== "string") {
    throw new Error(`Invalid authorLink value in ${relativeFile}. Expected an HTTP(S) URL or a site-relative path.`);
  }

  const authorLink = data.authorLink?.trim() || "";
  if (authorLink && !/^https?:\/\//i.test(authorLink) && !/^\/(?!\/)/.test(authorLink)) {
    throw new Error(`Invalid authorLink value in ${relativeFile}. Expected an HTTP(S) URL or a site-relative path.`);
  }

  const imageSource = data.image ? String(data.image).trim() : "";
  const image = imageSource ? resolveAssetUrl(imageSource, "news") : null;
  if (imageSource && !image) {
    throw new Error(`Invalid news image "${imageSource}" in ${relativeFile}. News images must exist under src/assets/news/.`);
  }

  const authorImageSource = data.authorImage ? String(data.authorImage).trim() : "";
  const authorImage = authorImageSource ? resolveAssetUrl(authorImageSource, "news") : null;
  if (authorImageSource && !authorImage) {
    throw new Error(`Invalid author image "${authorImageSource}" in ${relativeFile}. Author images must exist under src/assets/news/.`);
  }

  const title = String(data.title || "").trim() || titleFromSegment(fallbackSegment);

  return {
    title,
    image,
    imageAlt: String(data.imageAlt || "").trim(),
    showImageOnPage: data.showImageOnPage ?? true,
    tags,
    author: typeof data.author === "string" ? data.author.trim() : "",
    authorImage,
    authorLink,
    publishedAt: publishedDate.iso,
    publishedAtMs: publishedDate.timestamp,
    private: data.private === true,
  };
}

export function getNewsArticles() {
  const articles = scanMarkdownFiles(NEWS_DIRECTORY).map((relativeFile) => {
    const segments = markdownRouteSegments(relativeFile);
    if (!isSafeRouteSegments(segments)) throw new Error(`Unsafe news article path: ${relativeFile}`);

    const absoluteFile = path.resolve(NEWS_DIRECTORY, relativeFile);
    const source = fs.readFileSync(absoluteFile, "utf8");
    const parsed = matter(source);
    const metadata = normalizeFrontmatter(parsed.data, relativeFile, segments.at(-1));
    const pathname = `/news/${segments.join("/")}`;
    const parentSegments = segments.slice(0, -1);
    const linkBase = parentSegments.length ? `/news/${parentSegments.join("/")}` : "/news";

    return {
      ...metadata,
      source: parsed.content.trim(),
      segments,
      path: pathname,
      linkBase,
    };
  });

  const seen = new Set();
  for (const article of articles) {
    if (seen.has(article.path)) throw new Error(`Duplicate news article route: ${article.path}`);
    seen.add(article.path);
  }

  return articles.sort((left, right) => right.publishedAtMs - left.publishedAtMs || left.title.localeCompare(right.title));
}

export function getVisibleNewsArticles() {
  return getNewsArticles().filter((article) => !article.private);
}

export function getNewsArticle(slug = []) {
  const segments = Array.isArray(slug) ? slug : [];
  if (!segments.length || !isSafeRouteSegments(segments)) return null;
  const pathname = `/news/${segments.join("/")}`;
  return getNewsArticles().find((article) => article.path === pathname) ?? null;
}
