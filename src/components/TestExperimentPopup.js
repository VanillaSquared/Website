"use client";

import { useEffect, useState } from "react";

import Button from "@/components/Button";
import Modal from "@/components/Modal";

const EXPERIMENT_ID = "2026-07-test_experiment";
const POPUP_TREATMENT = "variant_1";

export default function TestExperimentPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolveExperiment() {
      try {
        const response = await fetch("/api/auth/status", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!response.ok) return;

        const data = await response.json();
        if (!cancelled && data.experiments?.[EXPERIMENT_ID] === POPUP_TREATMENT) {
          setOpen(true);
        }
      } catch {
        // Experiment failures must not prevent the page from loading.
      }
    }

    resolveExperiment();
    return () => { cancelled = true; };
  }, []);

  return (
    <Modal open={open} onClose={() => setOpen(false)} variant="compact">
      <div className="space-y-5">
        <p className="whitespace-pre-line text-soft">{"You are a Testificate.\nYou are a clanker.\nLOREM IPSUM DOLOR EST."}</p>
        <div className="flex justify-end">
          <Button size="sm" variant="tertiary" onClick={() => setOpen(false)}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}
