import { NextResponse } from "next/server";

import { evaluateBugSubmission, getTrustedClientIp } from "@/bugs/antiAbuse";
import { BUG_ATTACHMENT_CHUNK_BYTES } from "@/bugs/config";
import {
  createBugUploadSession,
  stageBugAttachmentChunk,
} from "@/bugs/chunkUploads";
import {
  allowBugAttachmentRequest,
  allowBugSubmissionAttempt,
  allowBugSubmissionGlobalAttempt,
} from "@/bugs/rateLimit";
import { validateBugSubmission } from "@/bugs/server";

const MAX_SESSION_REQUEST_BYTES = 32 * 1024;
const REPORT_TEXT_FIELDS = [
  "title",
  "description",
  "category",
  "minecraftVersion",
  "modVersion",
  "operatingSystem",
  "website",
];

function error(message, status) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

async function readBody(request, maximumBytes) {
  if (!request.body) return Buffer.alloc(0);

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maximumBytes) {
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

function validStartedAt(value) {
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "string" || !value.trim()) return false;
  return Number.isFinite(Number(value));
}

async function createSession(request) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_SESSION_REQUEST_BYTES) return error("Upload session request is too large.", 413);

  const rawBody = await readBody(request, MAX_SESSION_REQUEST_BYTES).catch(() => null);
  if (!rawBody) return error("Upload session request is too large.", 413);

  let payload;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return error("Upload session validation failed.", 400);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return error("Upload session validation failed.", 400);
  if (REPORT_TEXT_FIELDS.some((field) => typeof payload[field] !== "string") || !validStartedAt(payload.startedAt)) {
    return error("Upload session validation failed.", 400);
  }

  const input = {
    title: payload.title,
    description: payload.description,
    category: payload.category,
    minecraftVersion: payload.minecraftVersion,
    modVersion: payload.modVersion,
    operatingSystem: payload.operatingSystem,
    website: payload.website,
    startedAt: payload.startedAt,
  };

  const ipAddress = getTrustedClientIp(request);
  try {
    if (!(await allowBugSubmissionAttempt(request, ipAddress)) || !(await allowBugSubmissionGlobalAttempt(request))) {
      return error("Too many bug reports have been submitted. Please try again later.", 429);
    }
  } catch {
    return error("Bug report submission protection is unavailable.", 503);
  }

  const { score } = evaluateBugSubmission(request, input);
  if (score > 6) return error("Bug report submission was rejected.", 403);
  if (!validateBugSubmission(input)) return error("Bug report validation failed.", 400);

  const sessionToken = createBugUploadSession(input, payload.manifest);
  if (!sessionToken) return error("Attachment manifest validation failed.", 400);
  return NextResponse.json({ sessionToken }, { status: 201, headers: { "Cache-Control": "no-store" } });
}

async function stageChunk(request) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > BUG_ATTACHMENT_CHUNK_BYTES) return error("Upload chunk is too large.", 413);

  const ipAddress = getTrustedClientIp(request);
  try {
    if (!(await allowBugAttachmentRequest(request, ipAddress))) return error("Too many upload requests. Please try again later.", 429);
  } catch {
    return error("Upload protection is unavailable.", 503);
  }

  const content = await readBody(request, BUG_ATTACHMENT_CHUNK_BYTES).catch(() => null);
  if (!content) return error("Upload chunk is too large.", 413);

  const { searchParams } = new URL(request.url);
  try {
    const token = await stageBugAttachmentChunk({
      sessionToken: request.headers.get("x-vsq-upload-session"),
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

export async function POST(request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.toLowerCase().startsWith("application/json")) return createSession(request);
  if (contentType.toLowerCase().startsWith("application/octet-stream")) return stageChunk(request);
  return error("Unsupported upload request.", 415);
}
