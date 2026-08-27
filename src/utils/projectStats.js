const PROJECT_STATS_URL = "/api/project-stats";
const PROJECT_STATS_PROMISE_KEY = "__vanillaSquaredProjectStatsPromise";

function getCount(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function normalizeProviderStats(stats) {
  if (!stats || typeof stats !== "object") return null;

  const downloads = getCount(stats.downloads);
  const followers = getCount(stats.followers);
  return downloads === null && followers === null ? null : { downloads, followers };
}

function loadProjectStats() {
  return fetch(PROJECT_STATS_URL, {
    headers: { Accept: "application/json" },
  })
    .then((response) => {
      if (!response.ok) throw new Error(`Project stats request failed (${response.status})`);
      return response.json();
    })
    .then((stats) => ({
      modrinth: normalizeProviderStats(stats.modrinth),
      curseforge: normalizeProviderStats(stats.curseforge),
    }))
    .catch(() => null);
}

export function getProjectStats() {
  if (!globalThis[PROJECT_STATS_PROMISE_KEY]) {
    const request = loadProjectStats();
    globalThis[PROJECT_STATS_PROMISE_KEY] = request;

    request.finally(() => {
      if (globalThis[PROJECT_STATS_PROMISE_KEY] === request) {
        delete globalThis[PROJECT_STATS_PROMISE_KEY];
      }
    });
  }

  return globalThis[PROJECT_STATS_PROMISE_KEY];
}

export function getCombinedStats(modrinth, curseforge) {
  const providers = [modrinth, curseforge].filter(Boolean);
  if (!providers.length) return null;

  return {
    downloads: providers.reduce((total, stats) => total + (stats.downloads ?? 0), 0),
    followers: providers.reduce((total, stats) => total + (stats.followers ?? 0), 0),
  };
}

export function getCombinedDownloads(stats) {
  const providers = [stats?.modrinth, stats?.curseforge]
    .filter(Boolean)
    .map(({ downloads }) => downloads)
    .filter((downloads) => downloads !== null);

  return providers.length ? providers.reduce((total, downloads) => total + downloads, 0) : null;
}
