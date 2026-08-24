"use client";

import { useEffect, useState } from "react";

const PROJECT_STATS_URL = "/api/project-stats";

function getCount(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

async function getCombinedDownloads() {
  try {
    const response = await fetch(PROJECT_STATS_URL, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;

    const stats = await response.json();
    const downloads = [stats.modrinth?.downloads, stats.curseforge?.downloads]
      .map(getCount)
      .filter((count) => count !== null);

    return downloads.length > 0
      ? downloads.reduce((total, count) => total + count, 0)
      : null;
  } catch {
    return null;
  }
}

function formatDownloads(count) {
  const formattedCount = new Intl.NumberFormat("en-US").format(count);
  return `${formattedCount} ${count === 1 ? "download" : "downloads"}`;
}

export default function CombinedDownloadStats() {
  const [downloads, setDownloads] = useState(null);

  useEffect(() => {
    let active = true;
    getCombinedDownloads().then((nextDownloads) => {
      if (active) setDownloads(nextDownloads);
    });

    return () => {
      active = false;
    };
  }, []);

  if (downloads === null) return null;

  return (
    <p className="mt-8 text-center text-base tabular-nums text-soft">
      {formatDownloads(downloads)}
    </p>
  );
}
