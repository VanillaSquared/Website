"use client";

import { useEffect, useState } from "react";

const PROJECT_STATS_URL = "/api/project-stats";

function getCount(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function normalizeProviderStats(stats) {
  if (!stats || typeof stats !== "object") return null;

  const downloads = getCount(stats.downloads);
  const followers = getCount(stats.followers);
  return downloads === null && followers === null ? null : { downloads, followers };
}

async function getProjectStats() {
  try {
    const response = await fetch(PROJECT_STATS_URL, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;

    const stats = await response.json();
    return {
      modrinth: normalizeProviderStats(stats.modrinth),
      curseforge: normalizeProviderStats(stats.curseforge),
    };
  } catch {
    return null;
  }
}

function formatCount(count) {
  return new Intl.NumberFormat("en-US").format(count);
}

function StatSection({ title, stats }) {
  if (!stats) return null;

  return (
    <section className="py-3 text-center">
      <h3 className="text-sm font-semibold text-heading">{title}</h3>
      <dl className="mt-1 grid grid-cols-2 gap-2 text-sm tabular-nums text-soft">
        <div>
          <dt className="text-xs text-muted">Downloads</dt>
          <dd>{stats.downloads === null ? "—" : formatCount(stats.downloads)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Followers</dt>
          <dd>{stats.followers === null ? "—" : formatCount(stats.followers)}</dd>
        </div>
      </dl>
    </section>
  );
}

function combineStats(modrinth, curseforge) {
  const providers = [modrinth, curseforge].filter(Boolean);
  if (!providers.length) return null;

  return {
    downloads: providers.reduce((total, stats) => total + (stats.downloads ?? 0), 0),
    followers: providers.reduce((total, stats) => total + (stats.followers ?? 0), 0),
  };
}

export default function ProjectStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let active = true;
    getProjectStats().then((nextStats) => {
      if (active) setStats(nextStats);
    });

    return () => {
      active = false;
    };
  }, []);

  if (!stats) return null;

  const combined = combineStats(stats.modrinth, stats.curseforge);
  if (!combined) return null;

  return (
    <div>
      <StatSection title="Modrinth" stats={stats.modrinth} />
      <StatSection title="CurseForge" stats={stats.curseforge} />
      <StatSection title="Combined" stats={combined} />
    </div>
  );
}
