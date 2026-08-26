"use client";

import { useEffect, useState } from "react";

import { getCombinedStats, getProjectStats } from "@/utils/projectStats";

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

export default function ProjectStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getProjectStats().then((nextStats) => {
      if (active) {
        setStats(nextStats);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  if (loading) return <p className="py-3 text-center text-sm text-muted">Fetching...</p>;
  if (!stats) return null;

  const combined = getCombinedStats(stats.modrinth, stats.curseforge);
  if (!combined) return null;

  return (
    <div>
      <StatSection title="Modrinth" stats={stats.modrinth} />
      <StatSection title="CurseForge" stats={stats.curseforge} />
      <StatSection title="Combined" stats={combined} />
    </div>
  );
}
