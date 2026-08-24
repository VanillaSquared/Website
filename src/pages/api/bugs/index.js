import { consumeBugSubmissionAttempt } from "@/bugs/rateLimit";
import { BUG_ATTACHMENT_MAX_TOTAL_SIZE_BYTES } from "@/bugs/config";
import {
  BUG_PUBLIC_CACHE_CONTROL,
  createBugReport,
  listBugReports,
  validateBugAttachments,
  validateBugSubmission,
} from "@/bugs/server";

export const prerender = false;

const MAX_JSON_REQUEST_BYTES = 6144;
const MAX_MULTIPART_REQUEST_BYTES = BUG_ATTACHMENT_MAX_TOTAL_SIZE_BYTES + 128 * 1024;
const ATTACHMENT_FIELD = "attachments";
const ALLOWED_FIELDS = new Set([
  "title",
  "description",
  "category",
  "minecraftVersion",
  "modVersion",
  "operatingSystem",
]);

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(init.headers ?? {}),
    },
  });
}

function error(message, status) {
  return json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET({ url }) {
  try {
    const bugs = await listBugReports({
      q: url.searchParams.get("q")?.trim(),
      category: url.searchParams.getAll("category"),
      priority: url.searchParams.getAll("priority"),
      status: url.searchParams.getAll("status"),
    });
    return json({ bugs }, { headers: { "Cache-Control": BUG_PUBLIC_CACHE_CONTROL } });
  } catch {
    return error("Bug reports could not be loaded.", 503);
  }
}

function parseMultipartSubmission(formData) {
  const input = {};
  const attachments = [];

  for (const [key, value] of formData.entries()) {
    if (key === ATTACHMENT_FIELD) {
      if (typeof value === "string") return null;
      attachments.push(value);
      continue;
    }

    if (!ALLOWED_FIELDS.has(key) || typeof value !== "string" || Object.hasOwn(input, key)) return null;
    input[key] = value;
  }

  return { input, attachments };
}

export async function POST({ request }) {
  const contentType = request.headers.get("content-type") ?? "";
  const normalizedContentType = contentType.toLowerCase();
  const isJson = normalizedContentType.startsWith("application/json");
  const isMultipart = normalizedContentType.startsWith("multipart/form-data");
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  const maxRequestBytes = isMultipart ? MAX_MULTIPART_REQUEST_BYTES : MAX_JSON_REQUEST_BYTES;

  if (!isJson && !isMultipart) return error("Only JSON or multipart bug reports are accepted.", 415);
  if (declaredLength > maxRequestBytes) return error("Bug report is too large.", 413);

  let input;
  let attachments = [];
  try {
    if (isJson) {
      const rawBody = await request.text();
      if (Buffer.byteLength(rawBody, "utf8") > MAX_JSON_REQUEST_BYTES) return error("Bug report is too large.", 413);
      input = JSON.parse(rawBody);
    } else {
      const parsed = parseMultipartSubmission(await request.formData());
      if (!parsed) return error("Bug report validation failed.", 400);
      input = parsed.input;
      attachments = parsed.attachments;
    }
  } catch {
    return error("Bug report validation failed.", 400);
  }

  if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).some((key) => !ALLOWED_FIELDS.has(key))) {
    return error("Bug report validation failed.", 400);
  }

  if (!consumeBugSubmissionAttempt(request)) return error("Too many bug reports have been submitted. Please try again later.", 429);

  const report = validateBugSubmission(input);
  const validatedAttachments = validateBugAttachments(attachments);
  if (!report || !validatedAttachments) return error("Bug report validation failed.", 400);

  try {
    const bug = await createBugReport(report, validatedAttachments);
    return json({ bug }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (creationError) {
    console.error("Bug report creation failed.", {
      message: creationError instanceof Error ? creationError.message : "Unknown error",
      status: creationError?.status ?? null,
    });
    return error("Bug report could not be created.", 503);
  }
}
