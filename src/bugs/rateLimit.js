import "server-only";

import { createHash } from "node:crypto";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const ATTACHMENT_WINDOW_MS = 60 * 1000;
const MAX_ATTACHMENT_REQUESTS = 300;
const MAX_STORE_ENTRIES = 2048;
const ATTACHMENT_RATE_LIMIT_KEY = "bug-attachment-proxy";
const attemptsByClient = new Map();
const attachmentRequestsByClient = new Map();

function getClientKey(ipAddress) {
  return createHash("sha256").update(ipAddress || "unknown").digest("hex");
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

export function consumeBugSubmissionAttempt(ipAddress, now = Date.now()) {
  return consumeWindowedAttempt(attemptsByClient, getClientKey(ipAddress), WINDOW_MS, MAX_ATTEMPTS, now);
}

export function consumeBugAttachmentRequest(now = Date.now()) {
  return consumeWindowedAttempt(
    attachmentRequestsByClient,
    ATTACHMENT_RATE_LIMIT_KEY,
    ATTACHMENT_WINDOW_MS,
    MAX_ATTACHMENT_REQUESTS,
    now,
  );
}
