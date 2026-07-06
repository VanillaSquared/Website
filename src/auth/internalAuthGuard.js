import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { randomBytes, createHmac, timingSafeEqual } from "crypto";

export const INTERNAL_AUTH_HEADER = "x-vanillasquared-internal-auth";

const developmentSecretPath = ".data/internal-auth-secret";

function getDevelopmentInternalAuthSecret() {
  mkdirSync(dirname(developmentSecretPath), { recursive: true });

  if (!existsSync(developmentSecretPath)) {
    writeFileSync(developmentSecretPath, randomBytes(32).toString("base64url"), { mode: 0o600 });
  }

  return readFileSync(developmentSecretPath, "utf8").trim();
}

export function getInternalAuthSecret() {
  const secret = process.env.INTERNAL_AUTH_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV !== "production") {
    return getDevelopmentInternalAuthSecret();
  }

  throw new Error("INTERNAL_AUTH_SECRET is required for internal auth token exchange.");
}

function signInternalAuthPayload(payload) {
  return createHmac("sha256", getInternalAuthSecret()).update(payload).digest("base64url");
}

export function createInternalAuthHeader(provider) {
  const payload = `provider:${provider}`;
  return `${payload}.${signInternalAuthPayload(payload)}`;
}

export function verifyInternalAuthHeader(value, provider) {
  const [payload, signature] = String(value ?? "").split(".");
  const expectedPayload = `provider:${provider}`;

  if (payload !== expectedPayload || !signature) {
    return false;
  }

  const expected = Buffer.from(signInternalAuthPayload(payload));
  const received = Buffer.from(signature);

  return expected.length === received.length && timingSafeEqual(expected, received);
}
