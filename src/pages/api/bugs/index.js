import { evaluateBugSubmission } from "@/bugs/antiAbuse";
import { consumeBugSubmissionAttempt } from "@/bugs/rateLimit";
import { BUG_PUBLIC_CACHE_CONTROL, createBugReport, listBugReports, validateBugSubmission } from "@/bugs/server";

export const prerender = false;

const MAX_REQUEST_BYTES = 6144;
const ALLOWED_FIELDS = new Set([
  "title",
  "description",
  "category",
  "minecraftVersion",
  "modVersion",
  "operatingSystem",
  "startedAt",
  "website",
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

export async function POST({ request }) {
  const contentType = request.headers.get("content-type") ?? "";
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (!contentType.toLowerCase().startsWith("application/json")) return error("Only JSON bug reports are accepted.", 415);
  if (declaredLength > MAX_REQUEST_BYTES) return error("Bug report is too large.", 413);

  let rawBody;
  let input;
  try {
    rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_REQUEST_BYTES) return error("Bug report is too large.", 413);
    input = JSON.parse(rawBody);
  } catch {
    return error("Bug report validation failed.", 400);
  }

  if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).some((key) => !ALLOWED_FIELDS.has(key))) {
    return error("Bug report validation failed.", 400);
  }

  const { ipAddress, score } = evaluateBugSubmission(request, input);
  if (!await consumeBugSubmissionAttempt(ipAddress)) return error("Too many bug reports have been submitted. Please try again later.", 429);
  if (score > 6) return error("Bug report submission was rejected.", 403);

  const report = validateBugSubmission(input);
  if (!report) return error("Bug report validation failed.", 400);

  try {
    const bug = await createBugReport(report);
    return json({ bug }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return error("Bug report could not be created.", 503);
  }
}
