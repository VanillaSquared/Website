import { getTrustedClientIp } from "@/bugs/antiAbuse";
import { allowBugAttachmentRequest } from "@/bugs/rateLimit";
import { getBugAttachment } from "@/bugs/server";

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

function streamBuffer(buffer) {
  const chunkSize = 256 * 1024;
  let offset = 0;

  return new ReadableStream({
    pull(controller) {
      if (offset >= buffer.byteLength) {
        controller.close();
        return;
      }

      const end = Math.min(offset + chunkSize, buffer.byteLength);
      controller.enqueue(buffer.subarray(offset, end));
      offset = end;
    },
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
    const result = await getBugAttachment(decodeURIComponent(id), decodeURIComponent(file));
    if (!result) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

    return new Response(streamBuffer(result.content), {
      headers: {
        "Content-Type": result.mimeType,
        "Content-Length": String(result.content.byteLength),
        "Content-Disposition": contentDisposition(result.attachment),
        "Cache-Control": "public, max-age=3600, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Attachment could not be loaded.", { status: 503 });
  }
}
