import { createHash } from "node:crypto";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const attemptsByClient = new Map();

function getClientKey(ipAddress) {
  return createHash("sha256").update(ipAddress || "unknown").digest("hex");
}

export function consumeBugSubmissionAttempt(ipAddress, now = Date.now()) {
  const key = getClientKey(ipAddress);
  const recentAttempts = (attemptsByClient.get(key) ?? []).filter((time) => now - time < WINDOW_MS);

  if (recentAttempts.length >= MAX_ATTEMPTS) {
    attemptsByClient.set(key, recentAttempts);
    return false;
  }

  recentAttempts.push(now);
  attemptsByClient.set(key, recentAttempts);
  return true;
}
