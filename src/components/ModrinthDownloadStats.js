const MODRINTH_API_URL = "https://api.modrinth.com/v2/project/vsq";

async function getDownloadCount() {
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
    return Number.isSafeInteger(project.downloads) && project.downloads >= 0
      ? project.downloads
      : null;
  } catch {
    return null;
  }
}

export default async function ModrinthDownloadStats() {
  const downloads = await getDownloadCount();

  if (downloads === null) return null;

  const formattedDownloads = new Intl.NumberFormat("en-US").format(downloads);
  const downloadLabel = downloads === 1 ? "download" : "downloads";

  return (
    <p className="mt-8 text-center text-base tabular-nums text-soft">
      {formattedDownloads} {downloadLabel}
    </p>
  );
}
