import { unstable_cache } from "next/cache";

import { getTrustedClientIp } from "@/bugs/antiAbuse";
import { allowBugAttachmentRequest } from "@/bugs/rateLimit";
import { getBugAttachment } from "@/bugs/server";

const getCachedBugAttachment = unstable_cache(async (id, file) => {
  const result = await getBugAttachment(id, file);
  if (!result) {
    const error = new Error("Missing attachment");
    error.status = 404;
    throw error;
  }

  return {
    attachment: result.attachment,
    content: result.content.toString("base64"),
    mimeType: result.mimeType,
  };
}, ["bug-attachment-content"], { revalidate: 60 * 60 });

function contentDisposition(attachment) {
  const disposition = attachment.extension === "png" ? "inline" : "attachment";
  return `${disposition}; filename*=UTF-8''${encodeURIComponent(attachment.name)}`;
}

function rateLimitedResponse() {
  return new Response("Too many attachment requests.", {
    status: 429,
    headers: { "Retry-After": "60", "Cache-Control": "no-store" },
  });
}

export async function GET(request, { params }) {
  const ipAddress = getTrustedClientIp(request);

  try {
    if (!(await allowBugAttachmentRequest(request, ipAddress))) return rateLimitedResponse();
  } catch {
    return new Response("Attachment protection is unavailable.", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const { id, file } = await params;

  try {
    const result = await getCachedBugAttachment(decodeURIComponent(id), decodeURIComponent(file));
    const content = Buffer.from(result.content, "base64");
    return new Response(content, {
      headers: {
        "Content-Type": result.mimeType,
        "Content-Length": String(content.byteLength),
        "Content-Disposition": contentDisposition(result.attachment),
        "Cache-Control": "public, max-age=3600, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error?.status === 404) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
    return new Response("Attachment could not be loaded.", { status: 503 });
  }
}
