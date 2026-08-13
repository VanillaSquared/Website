import { NextResponse } from "next/server";

import { evaluateBugSubmission, getTrustedClientIp } from "@/bugs/antiAbuse";
import {
  BUG_ATTACHMENT_MAX_BYTES,
  BUG_ATTACHMENT_MAX_FILES,
  isAllowedBugAttachmentName,
} from "@/bugs/config";
import {
  consumeBugSubmissionAttempt,
  consumeBugSubmissionGlobalAttempt,
} from "@/bugs/rateLimit";
import {
  createBugReport,
  listBugReports,
  prepareBugAttachments,
  validateBugSubmission,
} from "@/bugs/server";

const MAX_REQUEST_BYTES = (BUG_ATTACHMENT_MAX_BYTES * BUG_ATTACHMENT_MAX_FILES) + (64 * 1024);
const ALLOWED_FIELDS = new Set([
  "title",
  "description",
  "category",
  "minecraftVersion",
  "modVersion",
  "operatingSystem",
  "startedAt",
  "website",
  "files",
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
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) return error("Only multipart bug reports are accepted.", 415);
  if (declaredLength > MAX_REQUEST_BYTES) return error("Bug report is too large.", 413);

  const ipAddress = getTrustedClientIp(request);
  if (!consumeBugSubmissionGlobalAttempt() || !consumeBugSubmissionAttempt(ipAddress)) {
    return error("Too many bug reports have been submitted. Please try again later.", 429);
  }

  let rawBody;
  try {
    rawBody = await readRequestBodyWithLimit(request, MAX_REQUEST_BYTES);
  } catch {
    return error("Bug report validation failed.", 400);
  }
  if (!rawBody) return error("Bug report is too large.", 413);

  let formData;
  try {
    const boundedRequest = new Request(request.url, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: rawBody,
    });
    formData = await boundedRequest.formData();
  } catch {
    return error("Bug report validation failed.", 400);
  }

  if ([...new Set(formData.keys())].some((key) => !ALLOWED_FIELDS.has(key))) {
    return error("Bug report validation failed.", 400);
  }

  if (REPORT_FIELDS.some((field) => formData.getAll(field).length !== 1)) return error("Bug report validation failed.", 400);

  const input = Object.fromEntries(REPORT_FIELDS.map((field) => [field, formData.get(field)]));
  const attachments = formData.getAll("files");
  const isUploadedFile = (file) => file && typeof file === "object" && typeof file.name === "string" && typeof file.size === "number" && typeof file.arrayBuffer === "function";

  if (attachments.some((file) => !isUploadedFile(file))) return error("Bug report validation failed.", 400);
  if (attachments.length > BUG_ATTACHMENT_MAX_FILES) return error(`A maximum of ${BUG_ATTACHMENT_MAX_FILES} files can be attached.`, 400);
  if (attachments.some((file) => file.size > BUG_ATTACHMENT_MAX_BYTES)) return error("Each attachment must be 10 MB or smaller.", 413);
  if (attachments.some((file) => !isAllowedBugAttachmentName(file.name))) return error("One or more attachments use an unsupported file type.", 400);

  const totalPayloadBytes = REPORT_FIELDS.reduce((total, field) => total + Buffer.byteLength(String(input[field] ?? ""), "utf8"), 0)
    + attachments.reduce((total, file) => total + file.size, 0);
  if (totalPayloadBytes > MAX_REQUEST_BYTES) return error("Bug report is too large.", 413);

  const { score } = evaluateBugSubmission(request, input);
  if (score > 6) return error("Bug report submission was rejected.", 403);

  const report = validateBugSubmission(input);
  if (!report) return error("Bug report validation failed.", 400);

  const preparedAttachments = await prepareBugAttachments(attachments);
  if (!preparedAttachments) return error("One or more attachments failed validation.", 400);

  try {
    const bug = await createBugReport(report, preparedAttachments);
    return NextResponse.json({ bug }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return error("Bug report could not be created.", 503);
  }
}
