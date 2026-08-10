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
    return {
      downloads: getCount(project.downloads),
      followers: getCount(project.followers),
    };
  } catch {
    return null;
  }
}

function formatCount(count, singular, plural) {
  const formattedCount = new Intl.NumberFormat("en-US").format(count);
  return `${formattedCount} ${count === 1 ? singular : plural}`;
}

export default async function ModrinthDownloadStats({
  showDownloads = true,
  showFollowers = true,
  compact = false,
}) {
  if (!showDownloads && !showFollowers) return null;

  const stats = await getProjectStats();

  if (stats === null) return null;

  const downloads = showDownloads && stats.downloads !== null
    ? formatCount(stats.downloads, "download", "downloads")
    : null;
  const followers = showFollowers && stats.followers !== null
    ? formatCount(stats.followers, "follower", "followers")
    : null;

  if (downloads === null && followers === null) return null;

  return (
    <p className={`${compact ? "text-sm" : "mt-8 text-base"} text-center tabular-nums text-soft`}>
      {downloads !== null && <span className="block">{downloads}</span>}
      {followers !== null && <span className="block">{followers}</span>}
    </p>
  );
}
