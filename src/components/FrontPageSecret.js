"use client";

import { useState } from "react";

import Modal from "@/components/Modal";
import ModrinthDownloadStats from "@/components/ModrinthDownloadStats";
import useSecretSequence from "@/hooks/useSecretSequence";

const STATS_SEQUENCE = "stats";

export default function FrontPageSecret({ statsContent = <ModrinthDownloadStats compact /> }) {
  const [statsOpen, setStatsOpen] = useState(false);

  useSecretSequence({
    sequence: STATS_SEQUENCE,
    onMatch: () => setStatsOpen(true),
  });

  return (
    <>
      <div className="front-page-secret-title">
        <h1 className="text-5xl font-bold tracking-tight text-heading sm:text-6xl">
          Vanilla²
        </h1>
      </div>

      <Modal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        variant="compact"
        ariaLabelledBy="front-page-stats-title"
        className="!min-h-0 !max-w-xs !p-4"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="front-page-stats-title" className="text-base font-semibold text-heading">
            Stats
          </h2>
          <button
            type="button"
            onClick={() => setStatsOpen(false)}
            className="rounded-md px-1.5 text-lg leading-none text-muted transition-colors hover:text-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label="Close Modrinth stats"
          >
            ×
          </button>
        </div>
        <div className="mt-2">
          {statsContent}
        </div>
      </Modal>
    </>
  );
}
