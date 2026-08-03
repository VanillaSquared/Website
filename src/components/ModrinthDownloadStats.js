const MODRINTH_API_URL = "https://api.modrinth.com/v2/project/vsq";

function getCount(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

async function getProjectStats() {
  try {
    const response = await fetch(MODRINTH_API_URL, {
      headers: {
        Accept: "application/json",
        "User-Agent": "VanillaSquaredWebsite/1.0 (https://vanillasquared.org)",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) return null;

    const project = await response.json();
    const downloads = getCount(project.downloads);
    const followers = getCount(project.followers);

    return downloads === null || followers === null
      ? null
      : { downloads, followers };
  } catch {
    return null;
  }
}

function formatCount(count, singular, plural) {
  const formattedCount = new Intl.NumberFormat("en-US").format(count);
  return `${formattedCount} ${count === 1 ? singular : plural}`;
}

export default async function ModrinthDownloadStats() {
  const stats = await getProjectStats();

  if (stats === null) return null;

  return (
    <p className="mt-8 text-center text-base tabular-nums text-soft">
      <span className="block">
        {formatCount(stats.downloads, "download", "downloads")}
      </span>
      <span className="block">
        {formatCount(stats.followers, "follower", "followers")}
      </span>
    </p>
  );
}
