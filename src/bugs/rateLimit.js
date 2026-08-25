import { createHash } from "node:crypto";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const attemptsByClient = new Map();

function requestIp(request) {
  return request.headers.get("cf-connecting-ip")
    || request.headers.get("x-real-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0].trim()
    || "unknown";
}

function getClientKey(ipAddress) {
  return createHash("sha256").update(ipAddress || "unknown").digest("hex");
}

export function consumeBugSubmissionAttempt(request, now = Date.now()) {
  const key = getClientKey(requestIp(request));
  const recentAttempts = (attemptsByClient.get(key) ?? []).filter((time) => now - time < WINDOW_MS);

  if (recentAttempts.length >= MAX_ATTEMPTS) {
    attemptsByClient.set(key, recentAttempts);
    return false;
  }

  recentAttempts.push(now);
  attemptsByClient.set(key, recentAttempts);
  return true;
}
