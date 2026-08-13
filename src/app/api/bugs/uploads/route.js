import { NextResponse } from "next/server";

import { getTrustedClientIp } from "@/bugs/antiAbuse";
import { BUG_ATTACHMENT_CHUNK_BYTES } from "@/bugs/config";
import { stageBugAttachmentChunk } from "@/bugs/chunkUploads";
import { allowBugAttachmentRequest } from "@/bugs/rateLimit";

function error(message, status) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

async function readChunk(request) {
  if (!request.body) return Buffer.alloc(0);

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > BUG_ATTACHMENT_CHUNK_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks, totalBytes);
}

export async function POST(request) {
  const contentType = request.headers.get("content-type") ?? "";
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (!contentType.toLowerCase().startsWith("application/octet-stream")) return error("Only binary upload chunks are accepted.", 415);
  if (declaredLength > BUG_ATTACHMENT_CHUNK_BYTES) return error("Upload chunk is too large.", 413);

  const ipAddress = getTrustedClientIp(request);
  try {
    if (!(await allowBugAttachmentRequest(request, ipAddress))) return error("Too many upload requests. Please try again later.", 429);
  } catch {
    return error("Upload protection is unavailable.", 503);
  }

  let content;
  try {
    content = await readChunk(request);
  } catch {
    return error("Upload chunk could not be read.", 400);
  }
  if (!content) return error("Upload chunk is too large.", 413);

  const { searchParams } = new URL(request.url);
  try {
    const token = await stageBugAttachmentChunk({
      fileId: searchParams.get("fileId"),
      fileIndex: searchParams.get("fileIndex"),
      name: searchParams.get("name"),
      fileSize: searchParams.get("fileSize"),
      chunkIndex: searchParams.get("chunkIndex"),
      chunkCount: searchParams.get("chunkCount"),
      content,
    });
    if (!token) return error("Upload chunk validation failed.", 400);
    return NextResponse.json({ token }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return error("Upload chunk could not be stored.", 503);
  }
}
