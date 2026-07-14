import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";

import { getAuthSubject } from "@/app/auth";
import { PERMISSIONS, hasPermission } from "@/auth/permissions";
import { getCommentAttachment, isCommentStoragePath } from "@/bugs/comments";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function disposition(value) {
  const name = path.basename(String(value ?? "attachment"));
  const ascii = name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_") || "attachment";
  const encoded = encodeURIComponent(name).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export async function GET(_request, { params }) {
  const subject = await getAuthSubject({ updateTokens: false });
  const user = subject?.properties;
  if (!await hasPermission(user, PERMISSIONS.VIEW_BUGS)) {
    return NextResponse.json({ error: user ? "Forbidden" : "Sign in required" }, { status: user ? 403 : 401 });
  }
  try {
    const values = await params;
    const publicId = decodeURIComponent(values.bug);
    const commentId = decodeURIComponent(values.comment);
    const attachmentId = decodeURIComponent(values.attachment);
    if (!/^[a-z0-9-]{3,32}$/i.test(publicId) || !/^[0-9a-f-]{36}$/i.test(commentId) || !/^[0-9a-f-]{36}$/i.test(attachmentId)) {
      throw new Error("Not found");
    }
    const attachment = await getCommentAttachment(publicId, commentId, attachmentId);
    if (!attachment || !isCommentStoragePath(attachment.storagePath)) throw new Error("Not found");
    await access(attachment.storagePath);
    return new Response(Readable.toWeb(createReadStream(attachment.storagePath)), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": disposition(attachment.originalName),
        "Content-Length": String(attachment.sizeBytes),
        "Content-Type": "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (cause) {
    if (cause?.code !== "ENOENT" && cause?.message !== "Not found") console.error("Failed to download comment attachment", cause);
    return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
  }
}
