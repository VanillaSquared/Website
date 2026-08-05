import "server-only";

import fs from "node:fs";
import path from "node:path";

const ASSETS_DIRECTORY = path.resolve(process.cwd(), "cdn");
const SAFE_ASSET_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export const ASSET_MIME_TYPES = Object.freeze({
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
});

export function getAssetDescriptor(segments) {
  if (
    !Array.isArray(segments)
    || !segments.length
    || segments.some((segment) => !SAFE_ASSET_SEGMENT.test(segment) || segment === "." || segment === "..")
  ) {
    return null;
  }

  const absolutePath = path.resolve(ASSETS_DIRECTORY, ...segments);
  const mimeType = ASSET_MIME_TYPES[path.extname(absolutePath).toLowerCase()];
  if (!absolutePath.startsWith(`${ASSETS_DIRECTORY}${path.sep}`) || !mimeType) return null;

  try {
    const stats = fs.statSync(absolutePath);
    return stats.isFile() ? { absolutePath, mimeType, stats } : null;
  } catch {
    return null;
  }
}

export function resolveAssetUrl(source, assetDirectory = "") {
  const prefix = "@cdn/";
  const normalizedSource = String(source);
  if (!normalizedSource.startsWith(prefix)) return null;

  const segments = normalizedSource.slice(prefix.length).split("/");
  const descriptor = getAssetDescriptor(segments);
  if (!descriptor || (assetDirectory && segments[0] !== assetDirectory)) return null;

  return `/media/${segments.map(encodeURIComponent).join("/")}`;
}
