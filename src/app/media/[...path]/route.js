import fs from "node:fs";

import { getAssetDescriptor } from "@/utils/serverAssets";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  const { path = [] } = await params;
  const asset = getAssetDescriptor(path);
  if (!asset) return new Response("Not found", { status: 404 });

  const etag = `"${asset.stats.size}-${asset.stats.mtimeMs}"`;
  const headers = {
    "Cache-Control": "public, max-age=0, must-revalidate",
    "Content-Type": asset.mimeType,
    ETag: etag,
    "X-Content-Type-Options": "nosniff",
  };

  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(fs.readFileSync(asset.absolutePath), { headers });
}
