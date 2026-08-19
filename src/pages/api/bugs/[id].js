import { BUG_PUBLIC_CACHE_CONTROL, getBugReportById } from "@/bugs/server";

export const prerender = false;

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(init.headers ?? {}),
    },
  });
}

export async function GET({ params }) {
  try {
    const bug = await getBugReportById(decodeURIComponent(params.id));
    if (!bug) return json({ error: "Bug report not found." }, { status: 404 });
    return json({ bug }, { headers: { "Cache-Control": BUG_PUBLIC_CACHE_CONTROL } });
  } catch {
    return json({ error: "Bug report could not be loaded." }, { status: 503 });
  }
}
