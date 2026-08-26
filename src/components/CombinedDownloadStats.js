"use client";

import { useEffect, useState } from "react";

import { getCombinedDownloads, getProjectStats } from "@/utils/projectStats";

function formatDownloads(count) {
  const formattedCount = new Intl.NumberFormat("en-US").format(count);
  return `${formattedCount} ${count === 1 ? "download" : "downloads"}`;
}

export default function CombinedDownloadStats() {
  const [downloads, setDownloads] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getProjectStats().then((stats) => {
      if (active) {
        setDownloads(getCombinedDownloads(stats));
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className="mt-8 text-center text-base text-soft">Fetching...</p>;
  }

  if (downloads === null) return null;

  return (
    <p className="mt-8 text-center text-base tabular-nums text-soft">
      {formatDownloads(downloads)}
    </p>
  );
}
