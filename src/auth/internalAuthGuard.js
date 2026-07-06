import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

export const INTERNAL_AUTH_HEADER = "x-vanillasquared-internal-auth";

export function getInternalAuthSecret() {
  const secret = process.env.INTERNAL_AUTH_SECRET;

  if (!secret) {
    throw new Error("INTERNAL_AUTH_SECRET is required for internal auth token exchange.");
  }

  return secret;
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
