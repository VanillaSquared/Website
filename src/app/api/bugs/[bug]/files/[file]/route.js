import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";

import { getAuthSubject } from "@/app/auth";
import { PERMISSIONS, hasPermission } from "@/auth/permissions";
import { getBugReportAttachment, isBugReportStoragePath } from "@/bugs/reporter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function contentDisposition(name) {
  const filename = path.basename(String(name ?? "attachment"));
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_") || "attachment";
  const encoded = encodeURIComponent(filename).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

function decodeRouteParam(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export async function GET(_request, { params }) {
  const subject = await getAuthSubject({ updateTokens: false });
  const user = subject?.properties;
  if (!await hasPermission(user, PERMISSIONS.VIEW_BUGS)) {
    return NextResponse.json({ error: user ? "Forbidden" : "Sign in required" }, { status: user ? 403 : 401 });
  }

  try {
    const { bug, file } = await params;
    const publicId = decodeRouteParam(bug);
    const fileId = decodeRouteParam(file);
    if (!publicId || !/^[a-z0-9-]{3,32}$/i.test(publicId) || !fileId || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(fileId)) {
      return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
    }
    const attachment = await getBugReportAttachment(publicId, fileId);
    if (!attachment || !isBugReportStoragePath(attachment.storagePath)) {
      return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
    }

    await access(attachment.storagePath);
    const stream = Readable.toWeb(createReadStream(attachment.storagePath));
    return new Response(stream, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": contentDisposition(attachment.originalName),
        "Content-Length": String(attachment.sizeBytes),
        "Content-Type": "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error?.code !== "ENOENT") console.error("Failed to download bug attachment", error);
    return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
  }
}
