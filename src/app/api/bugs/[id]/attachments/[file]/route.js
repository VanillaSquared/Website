import { getBugAttachment } from "@/bugs/server";

function contentDisposition(attachment) {
  const disposition = attachment.extension === "png" ? "inline" : "attachment";
  return `${disposition}; filename*=UTF-8''${encodeURIComponent(attachment.name)}`;
}

export async function GET(_request, { params }) {
  const { id, file } = await params;

  try {
    const result = await getBugAttachment(decodeURIComponent(id), decodeURIComponent(file));
    if (!result) return new Response("Not found", { status: 404 });

    return new Response(result.content, {
      headers: {
        "Content-Type": result.mimeType,
        "Content-Length": String(result.content.byteLength),
        "Content-Disposition": contentDisposition(result.attachment),
        "Cache-Control": "public, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Attachment could not be loaded.", { status: 503 });
  }
}
