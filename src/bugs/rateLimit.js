import "server-only";

import { createHash } from "node:crypto";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const GLOBAL_SUBMISSION_WINDOW_MS = 60 * 1000;
const MAX_GLOBAL_SUBMISSIONS = 30;
const ATTACHMENT_WINDOW_MS = 60 * 1000;
const MAX_ATTACHMENT_REQUESTS = 120;
const UPLOAD_FINALIZATION_WINDOW_MS = 15 * 60 * 1000;
const MAX_UPLOAD_FINALIZATIONS = 1;
const MAX_STORE_ENTRIES = 2048;
const LOCAL_GLOBAL_SUBMISSION_KEY = "bug-submission-global";
const attemptsByClient = new Map();
const globalSubmissionAttempts = new Map();
const attachmentRequestsByClient = new Map();
const uploadSessionFinalizations = new Map();

function getClientKey(ipAddress) {
  return createHash("sha256").update(ipAddress).digest("hex");
}

function evictExpiredEntries(store, windowMs, now) {
  for (const [key, attempts] of store) {
    const recentAttempts = attempts.filter((time) => now - time < windowMs);
    if (recentAttempts.length) store.set(key, recentAttempts);
    else store.delete(key);
  }

  while (store.size > MAX_STORE_ENTRIES) {
    const oldestKey = store.keys().next().value;
    if (oldestKey === undefined) break;
    store.delete(oldestKey);
  }
}

function consumeWindowedAttempt(store, key, windowMs, maximum, now) {
  evictExpiredEntries(store, windowMs, now);
  const recentAttempts = store.get(key) ?? [];
  if (recentAttempts.length >= maximum) return false;
  recentAttempts.push(now);
  store.set(key, recentAttempts);
  return true;
}

function localLimit(store, key, windowMs, maximum, now = Date.now()) {
  return consumeWindowedAttempt(store, key, windowMs, maximum, now);
}

function firewallPathPrefix() {
  const value = process.env.PUBLIC_VERCEL_FIREWALL_PATH_PREFIX
    || process.env.NEXT_PUBLIC_VERCEL_FIREWALL_PATH_PREFIX
    || "";
  return value && !value.startsWith("/") ? `/${value}` : value;
}

function rateLimitKey(id, key) {
  const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || process.env.RATE_LIMIT_SECRET || "";
  const digest = createHash("sha256").update(`${key}${id}${secret}`).digest("hex");
  return `${key}-${digest}`;
}

async function checkVercelRateLimit(request, id, key) {
  const host = request.headers.get("host");
  if (!host) throw new Error("Vercel rate limiting requires a request host.");

  const response = await fetch(`https://${host}${firewallPathPrefix()}/.well-known/vercel/rate-limit-api/${encodeURIComponent(id)}`, {
    method: "GET",
    cache: "no-store",
    redirect: "manual",
    headers: {
      "x-vercel-rate-limit-api": id,
      "x-vercel-rate-limit-key": rateLimitKey(id, key),
      "user-agent": "VanillaSquared Bug Rate Limiter",
      "x-forwarded-for": request.headers.get("x-forwarded-for") || "",
      "x-real-ip": request.headers.get("x-real-ip") || "",
      "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET || "",
    },
  });

  if (response.status === 204) return true;
  if (response.status === 429 || response.status === 403) return false;
  if (response.status === 404) throw new Error(`Vercel rate-limit ID '${id}' is not configured.`);
  throw new Error(`Unexpected Vercel rate-limit response: ${response.status}`);
}

export async function allowBugSubmissionAttempt(request, ipAddress, now = Date.now()) {
  if (process.env.VERCEL) {
    if (!ipAddress) return false;
    return checkVercelRateLimit(request, "bug-submission-client", ipAddress);
  }
  if (!ipAddress) return true;
  return localLimit(attemptsByClient, getClientKey(ipAddress), WINDOW_MS, MAX_ATTEMPTS, now);
}

export async function allowBugSubmissionGlobalAttempt(request, now = Date.now()) {
  if (process.env.VERCEL) return checkVercelRateLimit(request, "bug-submission-global", "global");
  return localLimit(globalSubmissionAttempts, LOCAL_GLOBAL_SUBMISSION_KEY, GLOBAL_SUBMISSION_WINDOW_MS, MAX_GLOBAL_SUBMISSIONS, now);
}

export async function allowBugAttachmentRequest(request, ipAddress, now = Date.now()) {
  if (process.env.VERCEL) {
    if (!ipAddress) return false;
    return checkVercelRateLimit(request, "bug-attachment-client", ipAddress);
  }
  if (!ipAddress) return true;
  return localLimit(attachmentRequestsByClient, getClientKey(ipAddress), ATTACHMENT_WINDOW_MS, MAX_ATTACHMENT_REQUESTS, now);
}

export async function allowBugUploadSessionFinalization(request, sessionToken, now = Date.now()) {
  if (!sessionToken) return false;
  const sessionKey = createHash("sha256").update(sessionToken).digest("hex");
  if (process.env.VERCEL) return checkVercelRateLimit(request, "bug-upload-finalize", sessionKey);
  return localLimit(uploadSessionFinalizations, sessionKey, UPLOAD_FINALIZATION_WINDOW_MS, MAX_UPLOAD_FINALIZATIONS, now);
}
