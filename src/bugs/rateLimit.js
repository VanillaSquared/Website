import "server-only";

import { createHash } from "node:crypto";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const ATTACHMENT_WINDOW_MS = 60 * 1000;
const MAX_ATTACHMENT_REQUESTS = 60;
const attemptsByClient = new Map();
const attachmentRequestsByClient = new Map();

function getClientKey(ipAddress) {
  return createHash("sha256").update(ipAddress || "unknown").digest("hex");
}

function consumeWindowedAttempt(store, key, windowMs, maximum, now) {
  const recentAttempts = (store.get(key) ?? []).filter((time) => now - time < windowMs);

  if (recentAttempts.length >= maximum) {
    store.set(key, recentAttempts);
    return false;
  }

  recentAttempts.push(now);
  store.set(key, recentAttempts);
  return true;
}

export function consumeBugSubmissionAttempt(ipAddress, now = Date.now()) {
  return consumeWindowedAttempt(attemptsByClient, getClientKey(ipAddress), WINDOW_MS, MAX_ATTEMPTS, now);
}

export function consumeBugAttachmentRequest(ipAddress, now = Date.now()) {
  return consumeWindowedAttempt(
    attachmentRequestsByClient,
    getClientKey(ipAddress),
    ATTACHMENT_WINDOW_MS,
    MAX_ATTACHMENT_REQUESTS,
    now,
  );
}
