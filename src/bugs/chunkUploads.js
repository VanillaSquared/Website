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
const TOKEN_VERSION = 1;
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

function decodeToken(token) {
  if (typeof token !== "string" || token.length > 2048) return null;
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
    if (!payload || payload.v !== TOKEN_VERSION || !Number.isFinite(payload.expiresAt) || payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
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

export async function stageBugAttachmentChunk({ fileId, fileIndex, name, fileSize, chunkIndex, chunkCount, content }) {
  const displayName = safeDisplayName(name);
  const size = Number(fileSize);
  const index = Number(chunkIndex);
  const count = Number(chunkCount);
  const attachmentIndex = Number(fileIndex);

  if (
    !SAFE_FILE_ID.test(String(fileId ?? ""))
    || !displayName
    || !isAllowedBugAttachmentName(displayName)
    || !Number.isInteger(attachmentIndex)
    || attachmentIndex < 0
    || attachmentIndex >= BUG_ATTACHMENT_MAX_FILES
    || !Number.isInteger(size)
    || size < 0
    || size > BUG_ATTACHMENT_MAX_BYTES
    || !Number.isInteger(index)
    || !Number.isInteger(count)
    || count < 1
    || count > MAX_CHUNKS_PER_FILE
    || index < 0
    || index >= count
  ) {
    return null;
  }

  const expectedChunkCount = Math.max(1, Math.ceil(size / BUG_ATTACHMENT_CHUNK_BYTES));
  if (count !== expectedChunkCount) return null;

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
    expiresAt: Date.now() + TOKEN_TTL_MS,
    fileId,
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

export async function prepareChunkedBugAttachments(tokens) {
  if (!Array.isArray(tokens) || tokens.length > MAX_CHUNK_TOKENS) return null;
  if (!tokens.length) return [];

  const payloads = tokens.map(decodeToken);
  if (payloads.some((payload) => !payload)) return null;

  const filesById = new Map();
  for (const payload of payloads) {
    if (
      !SAFE_FILE_ID.test(String(payload.fileId ?? ""))
      || !SAFE_GIT_SHA.test(String(payload.sha ?? ""))
      || !Number.isInteger(payload.fileIndex)
      || payload.fileIndex < 0
      || payload.fileIndex >= BUG_ATTACHMENT_MAX_FILES
      || !Number.isInteger(payload.fileSize)
      || payload.fileSize < 0
      || payload.fileSize > BUG_ATTACHMENT_MAX_BYTES
      || !Number.isInteger(payload.chunkIndex)
      || !Number.isInteger(payload.chunkCount)
      || payload.chunkCount < 1
      || payload.chunkCount > MAX_CHUNKS_PER_FILE
      || payload.chunkIndex < 0
      || payload.chunkIndex >= payload.chunkCount
      || !Number.isInteger(payload.chunkSize)
      || payload.chunkSize < 0
      || payload.chunkSize > BUG_ATTACHMENT_CHUNK_BYTES
      || !safeDisplayName(payload.name)
      || !isAllowedBugAttachmentName(payload.name)
      || payload.extension !== getBugAttachmentExtension(payload.name)
    ) {
      return null;
    }

    const file = filesById.get(payload.fileId) ?? [];
    file.push(payload);
    filesById.set(payload.fileId, file);
  }

  if (filesById.size > BUG_ATTACHMENT_MAX_FILES) return null;

  const usedFileIndexes = new Set();
  const prepared = [];
  let totalBytes = 0;

  for (const chunks of filesById.values()) {
    const first = chunks[0];
    if (usedFileIndexes.has(first.fileIndex)) return null;
    usedFileIndexes.add(first.fileIndex);

    if (chunks.length !== first.chunkCount) return null;
    chunks.sort((left, right) => left.chunkIndex - right.chunkIndex);

    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index];
      if (
        chunk.chunkIndex !== index
        || chunk.fileIndex !== first.fileIndex
        || chunk.name !== first.name
        || chunk.extension !== first.extension
        || chunk.fileSize !== first.fileSize
        || chunk.chunkCount !== first.chunkCount
      ) {
        return null;
      }
    }

    const declaredSize = chunks.reduce((total, chunk) => total + chunk.chunkSize, 0);
    if (declaredSize !== first.fileSize) return null;
    totalBytes += first.fileSize;
    if (totalBytes > BUG_ATTACHMENT_MAX_TOTAL_BYTES) return null;

    const chunkBuffers = await Promise.all(chunks.map(async (chunk) => {
      const content = await getGitBlob(chunk.sha);
      if (content.byteLength !== chunk.chunkSize) throw new Error("Bug attachment chunk size changed.");
      return content;
    }));
    const content = Buffer.concat(chunkBuffers, first.fileSize);
    if (content.byteLength !== first.fileSize) return null;
    if (first.extension === "png" && !hasPngSignature(content)) return null;

    prepared.push({
      fileIndex: first.fileIndex,
      name: first.name,
      extension: first.extension,
      size: content.byteLength,
      content,
    });
  }

  prepared.sort((left, right) => left.fileIndex - right.fileIndex);
  return prepared.map(({ name, extension, size, content }) => ({ name, extension, size, content }));
}
