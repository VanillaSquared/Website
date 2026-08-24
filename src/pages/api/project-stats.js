export const prerender = false;

const MODRINTH_API_URL = "https://api.modrinth.com/v2/project/vsq";
const CURSEFORGE_API_URL = "https://api.curse.tools/v1/cf/mods/search?gameId=432&slug=vsq";
const CURSEFORGE_PROJECT_ID = 1651903;

function getCount(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) throw new Error(`Stats request failed (${response.status})`);
  return response.json();
}

async function getModrinthStats() {
  const project = await fetchJson(MODRINTH_API_URL);
  return {
    downloads: getCount(project.downloads),
    followers: getCount(project.followers),
  };
}

async function getCurseForgeStats() {
  const response = await fetchJson(CURSEFORGE_API_URL);
  const project = response.data?.find(({ id }) => id === CURSEFORGE_PROJECT_ID);

  if (!project) throw new Error("CurseForge project was not found");

  return {
    downloads: getCount(project.downloadCount),
    // CurseForge exposes the count displayed by its project follow control as thumbsUpCount.
    followers: getCount(project.thumbsUpCount),
  };
}

export async function GET() {
  const [modrinthResult, curseForgeResult] = await Promise.allSettled([
    getModrinthStats(),
    getCurseForgeStats(),
  ]);
  const modrinth = modrinthResult.status === "fulfilled" ? modrinthResult.value : null;
  const curseforge = curseForgeResult.status === "fulfilled" ? curseForgeResult.value : null;

  return new Response(JSON.stringify({ modrinth, curseforge }), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
