import { createHash } from "node:crypto";

const WINDOW_MS = 15 * 60 * 1000;
const WINDOW_SECONDS = WINDOW_MS / 1000;
const MAX_ATTEMPTS = 3;
const attemptsByClient = new Map();

function getClientKey(ipAddress) {
  const salt = process.env.BUG_RATE_LIMIT_SALT || "vanillasquared-bug-reporter";
  return `bug-report-rate:${createHash("sha256").update(`${salt}:${ipAddress || "unknown"}`).digest("hex")}`;
}

function consumeMemoryAttempt(key, now) {
  const recentAttempts = (attemptsByClient.get(key) ?? []).filter((time) => now - time < WINDOW_MS);

  if (recentAttempts.length >= MAX_ATTEMPTS) {
    attemptsByClient.set(key, recentAttempts);
    return false;
  }

  recentAttempts.push(now);
  attemptsByClient.set(key, recentAttempts);
  return true;
}

function getDistributedRateLimitConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

async function consumeDistributedAttempt(key, config) {
  const response = await fetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, WINDOW_SECONDS],
    ]),
  });

  if (!response.ok) throw new Error("Shared rate limiter request failed.");
  const results = await response.json();
  const count = Number(results?.[0]?.result);
  if (!Number.isFinite(count)) throw new Error("Shared rate limiter returned an invalid count.");
  return count <= MAX_ATTEMPTS;
}

export async function consumeBugSubmissionAttempt(ipAddress, now = Date.now()) {
  const key = getClientKey(ipAddress);
  const config = getDistributedRateLimitConfig();

  if (config) {
    try {
      return await consumeDistributedAttempt(key, config);
    } catch {
      // A limiter outage must not make the report form unavailable. The local
      // fallback still protects warm instances while the shared store recovers.
    }
  }

  return consumeMemoryAttempt(key, now);
}
