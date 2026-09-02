import { getDocsSearchIndex } from "@/docs/server";

export const prerender = true;

export function GET() {
  return new Response(JSON.stringify({ results: getDocsSearchIndex() }), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
