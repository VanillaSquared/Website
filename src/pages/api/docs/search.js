import { searchDocuments } from "@/docs/server";

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

export function GET({ url }) {
  const query = url.searchParams.get("q")?.trim() ?? "";

  if (query.length > 100) {
    return json({ error: "Search queries must be 100 characters or fewer." }, { status: 400 });
  }

  return json({ results: query ? searchDocuments(query) : [] }, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
