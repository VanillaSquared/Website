import fs from "node:fs";
import { Readable } from "node:stream";

import { getAssetDescriptor } from "@/utils/serverAssets";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  const { path = [] } = await params;
  const asset = getAssetDescriptor(path);
  if (!asset) return new Response("Not found", { status: 404 });

  const etag = `"${asset.stats.size}-${asset.stats.mtimeMs}"`;
  const headers = {
    "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    "Content-Length": String(asset.stats.size),
    "Content-Type": asset.mimeType,
    ETag: etag,
    "X-Content-Type-Options": "nosniff",
  };

  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(Readable.toWeb(fs.createReadStream(asset.absolutePath)), { headers });
}
