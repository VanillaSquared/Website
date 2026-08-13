import { unstable_cache } from "next/cache";

import { getTrustedClientIp } from "@/bugs/antiAbuse";
import {
  consumeBugAttachmentRequest,
  consumeBugAttachmentUpstreamAttempt,
} from "@/bugs/rateLimit";
import { getBugAttachment } from "@/bugs/server";

function attachmentRateLimitError() {
  const error = new Error("Too many attachment requests.");
  error.status = 429;
  return error;
}

const getCachedBugAttachment = unstable_cache(async (id, file) => {
  if (!consumeBugAttachmentUpstreamAttempt()) throw attachmentRateLimitError();

  const result = await getBugAttachment(id, file);
  if (!result) return null;

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
  if (!consumeBugAttachmentRequest(ipAddress)) return rateLimitedResponse();

  const { id, file } = await params;

  try {
    const result = await getCachedBugAttachment(decodeURIComponent(id), decodeURIComponent(file));
    if (!result) return new Response("Not found", { status: 404 });

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
    if (error?.status === 429) return rateLimitedResponse();
    return new Response("Attachment could not be loaded.", { status: 503 });
  }
}
