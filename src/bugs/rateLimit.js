import "server-only";

import { createHash } from "node:crypto";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const GLOBAL_SUBMISSION_WINDOW_MS = 60 * 1000;
const MAX_GLOBAL_SUBMISSIONS = 30;
const ATTACHMENT_WINDOW_MS = 60 * 1000;
const MAX_ATTACHMENT_REQUESTS = 120;
const MAX_ATTACHMENT_UPSTREAM_REQUESTS = 120;
const MAX_STORE_ENTRIES = 2048;
const GLOBAL_SUBMISSION_KEY = "bug-submission-global";
const ATTACHMENT_UPSTREAM_KEY = "bug-attachment-upstream";
const attemptsByClient = new Map();
const globalSubmissionAttempts = new Map();
const attachmentRequestsByClient = new Map();
const attachmentUpstreamAttempts = new Map();

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

export function consumeBugSubmissionAttempt(ipAddress, now = Date.now()) {
  if (!ipAddress) return true;
  return consumeWindowedAttempt(attemptsByClient, getClientKey(ipAddress), WINDOW_MS, MAX_ATTEMPTS, now);
}

export function consumeBugSubmissionGlobalAttempt(now = Date.now()) {
  return consumeWindowedAttempt(
    globalSubmissionAttempts,
    GLOBAL_SUBMISSION_KEY,
    GLOBAL_SUBMISSION_WINDOW_MS,
    MAX_GLOBAL_SUBMISSIONS,
    now,
  );
}

export function consumeBugAttachmentRequest(ipAddress, now = Date.now()) {
  if (!ipAddress) return true;
  return consumeWindowedAttempt(
    attachmentRequestsByClient,
    getClientKey(ipAddress),
    ATTACHMENT_WINDOW_MS,
    MAX_ATTACHMENT_REQUESTS,
    now,
  );
}

export function consumeBugAttachmentUpstreamAttempt(now = Date.now()) {
  return consumeWindowedAttempt(
    attachmentUpstreamAttempts,
    ATTACHMENT_UPSTREAM_KEY,
    ATTACHMENT_WINDOW_MS,
    MAX_ATTACHMENT_UPSTREAM_REQUESTS,
    now,
  );
}
