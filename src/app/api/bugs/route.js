import { NextResponse } from "next/server";

import { evaluateBugSubmission, getTrustedClientIp } from "@/bugs/antiAbuse";
import { BUG_ATTACHMENT_MAX_FILES } from "@/bugs/config";
import { prepareChunkedBugAttachments } from "@/bugs/chunkUploads";
import {
  allowBugSubmissionAttempt,
  allowBugSubmissionGlobalAttempt,
} from "@/bugs/rateLimit";
import {
  createBugReport,
  listBugReports,
  validateBugSubmission,
} from "@/bugs/server";

const MAX_REQUEST_BYTES = 64 * 1024;
const ALLOWED_FIELDS = new Set([
  "title",
  "description",
  "category",
  "minecraftVersion",
  "modVersion",
  "operatingSystem",
  "startedAt",
  "website",
  "attachmentTokens",
]);
const REPORT_FIELDS = [
  "title",
  "description",
  "category",
  "minecraftVersion",
  "modVersion",
  "operatingSystem",
  "startedAt",
  "website",
];

function error(message, status) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

async function readRequestBodyWithLimit(request, maximumBytes) {
  if (!request.body) return new Uint8Array();

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
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  try {
    const bugs = await listBugReports({
      q: searchParams.get("q")?.trim(),
      category: searchParams.getAll("category"),
      priority: searchParams.getAll("priority"),
      status: searchParams.getAll("status"),
    });
    return NextResponse.json({ bugs }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return error("Bug reports could not be loaded.", 503);
  }
}

export async function POST(request) {
  const contentType = request.headers.get("content-type") ?? "";
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (!contentType.toLowerCase().startsWith("application/json")) return error("Only JSON bug reports are accepted.", 415);
  if (declaredLength > MAX_REQUEST_BYTES) return error("Bug report is too large.", 413);

  const ipAddress = getTrustedClientIp(request);
  try {
    if (!(await allowBugSubmissionAttempt(request, ipAddress)) || !(await allowBugSubmissionGlobalAttempt(request))) {
      return error("Too many bug reports have been submitted. Please try again later.", 429);
    }
  } catch {
    return error("Bug report submission protection is unavailable.", 503);
  }

  let rawBody;
  try {
    rawBody = await readRequestBodyWithLimit(request, MAX_REQUEST_BYTES);
  } catch {
    return error("Bug report validation failed.", 400);
  }
  if (!rawBody) return error("Bug report is too large.", 413);

  let payload;
  try {
    payload = JSON.parse(Buffer.from(rawBody).toString("utf8"));
  } catch {
    return error("Bug report validation failed.", 400);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return error("Bug report validation failed.", 400);
  if (Object.keys(payload).some((key) => !ALLOWED_FIELDS.has(key))) return error("Bug report validation failed.", 400);
  if (REPORT_FIELDS.some((field) => typeof payload[field] !== "string")) return error("Bug report validation failed.", 400);

  const attachmentTokens = payload.attachmentTokens ?? [];
  if (!Array.isArray(attachmentTokens) || attachmentTokens.some((token) => typeof token !== "string")) {
    return error("Bug report validation failed.", 400);
  }

  const input = Object.fromEntries(REPORT_FIELDS.map((field) => [field, payload[field]]));
  const { score } = evaluateBugSubmission(request, input);
  if (score > 6) return error("Bug report submission was rejected.", 403);

  const report = validateBugSubmission(input);
  if (!report) return error("Bug report validation failed.", 400);

  let preparedAttachments;
  try {
    preparedAttachments = await prepareChunkedBugAttachments(attachmentTokens);
  } catch {
    return error("One or more attachments could not be loaded.", 503);
  }
  if (!preparedAttachments || preparedAttachments.length > BUG_ATTACHMENT_MAX_FILES) {
    return error("One or more attachments failed validation.", 400);
  }

  try {
    const bug = await createBugReport(report, preparedAttachments);
    const attachmentUploadFailed = preparedAttachments.length > 0 && bug.attachments.length !== preparedAttachments.length;
    return NextResponse.json({ bug, attachmentUploadFailed }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return error("Bug report could not be created.", 503);
  }
}
