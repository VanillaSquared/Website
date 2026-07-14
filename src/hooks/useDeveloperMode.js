"use client";

import { useEffect, useState } from "react";

import { DEVELOPER_MODE_EVENT } from "@/utils/developerMode";

export default function useDeveloperMode() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/auth/preferences", { cache: "no-store", credentials: "same-origin" });
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) setEnabled(Boolean(data.preferences?.developerMode));
      } catch {
        // Keep developer mode disabled if preferences cannot be loaded.
      }
    }

    function sync(event) {
      setEnabled(Boolean(event.detail));
    }

    load();
    window.addEventListener(DEVELOPER_MODE_EVENT, sync);
    return () => {
      cancelled = true;
      window.removeEventListener(DEVELOPER_MODE_EVENT, sync);
    };
  }, []);

  async function update(nextEnabled) {
    const next = Boolean(nextEnabled);
    const previous = enabled;
    setEnabled(next);
    window.dispatchEvent(new CustomEvent(DEVELOPER_MODE_EVENT, { detail: next }));
    try {
      const response = await fetch("/api/auth/preferences", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ developerMode: next }),
      });
      if (!response.ok) throw new Error("Could not update developer mode.");
    } catch {
      setEnabled(previous);
      window.dispatchEvent(new CustomEvent(DEVELOPER_MODE_EVENT, { detail: previous }));
    }
  }

  return [enabled, update];
}
