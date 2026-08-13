import "server-only";

import crypto from "node:crypto";

import {
  BUG_ATTACHMENT_CHUNK_BYTES,
  BUG_ATTACHMENT_MAX_BYTES,
  BUG_ATTACHMENT_MAX_FILES,
  BUG_ATTACHMENT_MAX_TOTAL_BYTES,
  getBugAttachmentExtension,
  isAllowedBugAttachmentName,
} from "@/bugs/config";

const GITHUB_API = "https://api.github.com/repos/VanillaSquared/Issues";
const TOKEN_VERSION = 2;
const TOKEN_TTL_MS = 15 * 60 * 1000;
const SAFE_FILE_ID = /^[A-Fa-f0-9-]{36}$/;
const SAFE_GIT_SHA = /^[a-f0-9]{40}$/;
const MAX_CHUNKS_PER_FILE = Math.max(1, Math.ceil(BUG_ATTACHMENT_MAX_BYTES / BUG_ATTACHMENT_CHUNK_BYTES));
const MAX_CHUNK_TOKENS = BUG_ATTACHMENT_MAX_FILES * MAX_CHUNKS_PER_FILE;

function githubHeaders(overrides = {}) {
  const token = process.env.github;
  if (!token) throw new Error("Bug storage is not configured.");

  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    ...overrides,
  };
}

function signingKey() {
  const token = process.env.github;
  if (!token) throw new Error("Bug storage is not configured.");
  return crypto.createHash("sha256").update(`vsq-bug-upload:${token}`).digest();
}

function safeDisplayName(value) {
  const normalized = String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/]/g, "_")
    .trim();
  return normalized && normalized.length <= 180 ? normalized : null;
}

function hasPngSignature(buffer) {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return buffer.length >= signature.length && signature.every((byte, index) => buffer[index] === byte);
}

function encodeToken(payload) {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", signingKey()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function decodeToken(token, kind) {
  if (typeof token !== "string" || token.length > 8192) return null;
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra !== undefined) return null;

  const expected = crypto.createHmac("sha256", signingKey()).update(encoded).digest();
  let actual;
  try {
    actual = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (
      !payload
      || payload.v !== TOKEN_VERSION
      || payload.kind !== kind
      || !Number.isFinite(payload.expiresAt)
      || payload.expiresAt < Date.now()
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function normalizedStartedAt(value) {
  const numeric = typeof value === "number" ? value : Number(String(value ?? "").trim());
  return Number.isFinite(numeric) ? String(numeric) : null;
}

function normalizedReportInput(input) {
  const startedAt = normalizedStartedAt(input?.startedAt);
  if (!startedAt) return null;

  return {
    title: String(input?.title ?? ""),
    description: String(input?.description ?? ""),
    category: String(input?.category ?? ""),
    minecraftVersion: String(input?.minecraftVersion ?? ""),
    modVersion: String(input?.modVersion ?? ""),
    operatingSystem: String(input?.operatingSystem ?? ""),
    website: String(input?.website ?? ""),
    startedAt,
  };
}

function normalizeManifest(manifest) {
  if (!Array.isArray(manifest) || manifest.length > BUG_ATTACHMENT_MAX_FILES) return null;

  const normalized = [];
  let totalBytes = 0;
  const seenIds = new Set();

  for (let fileIndex = 0; fileIndex < manifest.length; fileIndex += 1) {
    const file = manifest[fileIndex];
    const fileId = String(file?.fileId ?? "");
    const name = safeDisplayName(file?.name);
    const size = Number(file?.fileSize);
    const chunkCount = Number(file?.chunkCount);

    if (
      !SAFE_FILE_ID.test(fileId)
      || seenIds.has(fileId)
      || !name
      || !isAllowedBugAttachmentName(name)
      || !Number.isInteger(size)
      || size < 0
      || size > BUG_ATTACHMENT_MAX_BYTES
      || !Number.isInteger(chunkCount)
      || chunkCount < 1
      || chunkCount > MAX_CHUNKS_PER_FILE
      || chunkCount !== Math.max(1, Math.ceil(size / BUG_ATTACHMENT_CHUNK_BYTES))
    ) {
      return null;
    }

    totalBytes += size;
    if (totalBytes > BUG_ATTACHMENT_MAX_TOTAL_BYTES) return null;
    seenIds.add(fileId);
    normalized.push({ fileId, fileIndex, name, fileSize: size, chunkCount });
  }

  return normalized;
}

function sessionDigest(reportInput, manifest) {
  return crypto.createHash("sha256")
    .update(JSON.stringify({ report: reportInput, manifest }))
    .digest("hex");
}

export function createBugUploadSession(input, manifest) {
  const reportInput = normalizedReportInput(input);
  const normalizedManifest = normalizeManifest(manifest);
  if (!reportInput || !normalizedManifest || !normalizedManifest.length) return null;

  return encodeToken({
    v: TOKEN_VERSION,
    kind: "session",
    expiresAt: Date.now() + TOKEN_TTL_MS,
    digest: sessionDigest(reportInput, normalizedManifest),
    manifest: normalizedManifest,
  });
}

export function validateBugUploadSession(token, input, manifest = null) {
  const session = decodeToken(token, "session");
  const reportInput = normalizedReportInput(input);
  if (!session || !reportInput || !Array.isArray(session.manifest)) return null;

  const normalizedManifest = manifest === null ? session.manifest : normalizeManifest(manifest);
  if (!normalizedManifest) return null;

  const digest = sessionDigest(reportInput, normalizedManifest);
  if (digest !== session.digest || JSON.stringify(normalizedManifest) !== JSON.stringify(session.manifest)) return null;
  return session;
}

async function createGitBlob(content) {
  const response = await fetch(`${GITHUB_API}/git/blobs`, {
    method: "POST",
    cache: "no-store",
    headers: githubHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ content: content.toString("base64"), encoding: "base64" }),
  });
  if (!response.ok) throw new Error("Bug attachment chunk could not be staged.");
  return response.json();
}

async function getGitBlob(sha) {
  const response = await fetch(`${GITHUB_API}/git/blobs/${sha}`, {
    cache: "no-store",
    headers: githubHeaders(),
  });
  if (!response.ok) throw new Error("Bug attachment chunk could not be loaded.");

  const blob = await response.json();
  if (blob.encoding !== "base64" || typeof blob.content !== "string") throw new Error("Bug attachment chunk is invalid.");
  return Buffer.from(blob.content.replace(/\s/g, ""), "base64");
}

export async function stageBugAttachmentChunk({ sessionToken, fileId, fileIndex, name, fileSize, chunkIndex, chunkCount, content }) {
  const session = decodeToken(sessionToken, "session");
  const displayName = safeDisplayName(name);
  const size = Number(fileSize);
  const index = Number(chunkIndex);
  const count = Number(chunkCount);
  const attachmentIndex = Number(fileIndex);

  if (!session || !Array.isArray(session.manifest)) return null;

  const manifestFile = session.manifest.find((file) => file.fileId === String(fileId ?? ""));
  if (
    !manifestFile
    || !displayName
    || attachmentIndex !== manifestFile.fileIndex
    || displayName !== manifestFile.name
    || size !== manifestFile.fileSize
    || count !== manifestFile.chunkCount
    || !Number.isInteger(index)
    || index < 0
    || index >= count
  ) {
    return null;
  }

  const expectedChunkSize = size === 0
    ? 0
    : index === count - 1
      ? size - (index * BUG_ATTACHMENT_CHUNK_BYTES)
      : BUG_ATTACHMENT_CHUNK_BYTES;
  if (!Buffer.isBuffer(content) || content.byteLength !== expectedChunkSize) return null;

  const blob = await createGitBlob(content);
  if (!SAFE_GIT_SHA.test(String(blob.sha ?? ""))) throw new Error("Bug attachment chunk could not be staged.");

  return encodeToken({
    v: TOKEN_VERSION,
    kind: "chunk",
    expiresAt: session.expiresAt,
    sessionDigest: session.digest,
    fileId: manifestFile.fileId,
    fileIndex: attachmentIndex,
    name: displayName,
    extension: getBugAttachmentExtension(displayName),
    fileSize: size,
    chunkIndex: index,
    chunkCount: count,
    chunkSize: content.byteLength,
    sha: blob.sha,
  });
}

export async function prepareChunkedBugAttachments(tokens, sessionToken, input) {
  if (!Array.isArray(tokens) || tokens.length > MAX_CHUNK_TOKENS) return null;
  if (!tokens.length) return [];

  const session = validateBugUploadSession(sessionToken, input);
  if (!session) return null;

  const payloads = tokens.map((token) => decodeToken(token, "chunk"));
  if (payloads.some((payload) => !payload || payload.sessionDigest !== session.digest)) return null;

  const filesById = new Map();
  for (const payload of payloads) {
    const manifestFile = session.manifest.find((file) => file.fileId === payload.fileId);
    if (
      !manifestFile
      || !SAFE_GIT_SHA.test(String(payload.sha ?? ""))
      || payload.fileIndex !== manifestFile.fileIndex
      || payload.name !== manifestFile.name
      || payload.fileSize !== manifestFile.fileSize
      || payload.chunkCount !== manifestFile.chunkCount
      || payload.extension !== getBugAttachmentExtension(manifestFile.name)
      || !Number.isInteger(payload.chunkIndex)
      || payload.chunkIndex < 0
      || payload.chunkIndex >= payload.chunkCount
      || !Number.isInteger(payload.chunkSize)
      || payload.chunkSize < 0
      || payload.chunkSize > BUG_ATTACHMENT_CHUNK_BYTES
    ) {
      return null;
    }

    const file = filesById.get(payload.fileId) ?? [];
    file.push(payload);
    filesById.set(payload.fileId, file);
  }

  if (filesById.size !== session.manifest.length) return null;

  const prepared = [];
  for (const manifestFile of session.manifest) {
    const chunks = filesById.get(manifestFile.fileId);
    if (!chunks || chunks.length !== manifestFile.chunkCount) return null;
    chunks.sort((left, right) => left.chunkIndex - right.chunkIndex);

    for (let index = 0; index < chunks.length; index += 1) {
      if (chunks[index].chunkIndex !== index) return null;
    }

    const declaredSize = chunks.reduce((total, chunk) => total + chunk.chunkSize, 0);
    if (declaredSize !== manifestFile.fileSize) return null;

    const chunkBuffers = await Promise.all(chunks.map(async (chunk) => {
      const content = await getGitBlob(chunk.sha);
      if (content.byteLength !== chunk.chunkSize) throw new Error("Bug attachment chunk size changed.");
      return content;
    }));
    const content = Buffer.concat(chunkBuffers, manifestFile.fileSize);
    if (content.byteLength !== manifestFile.fileSize) return null;

    const extension = getBugAttachmentExtension(manifestFile.name);
    if (extension === "png" && !hasPngSignature(content)) return null;

    prepared.push({
      name: manifestFile.name,
      extension,
      size: content.byteLength,
      content,
    });
  }

  return prepared;
}
