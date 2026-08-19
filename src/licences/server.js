import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import { isSafeRouteSegments, markdownRouteSegments, scanMarkdownFiles, titleFromSegment } from "@/markdown/server";

const LICENCES_DIRECTORY = path.resolve(process.cwd(), "src", "licences");
let licences;

export function getLicences() {
  if (process.env.NODE_ENV === "production" && licences) return licences;

  licences = scanMarkdownFiles(LICENCES_DIRECTORY).map((relativeFile) => {
    const segments = markdownRouteSegments(relativeFile);
    if (!isSafeRouteSegments(segments)) throw new Error(`Unsafe licence path: ${relativeFile}`);

    const source = fs.readFileSync(path.resolve(LICENCES_DIRECTORY, relativeFile), "utf8");
    const parsed = matter(source);

    return {
      slug: segments.join("/"),
      title: String(parsed.data.title || titleFromSegment(segments.at(-1))).trim(),
      description: String(parsed.data.description || "").trim(),
      source: parsed.content.trim(),
    };
  });
  return licences;
}

export function getLicence(slug) {
  return getLicences().find((licence) => licence.slug === slug) ?? null;
}
