"use client";

import { useEffect, useState } from "react";

import { DEVELOPER_MODE_EVENT, getDeveloperMode, setDeveloperMode } from "@/utils/developerMode";

export default function useDeveloperMode() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(getDeveloperMode());
    function sync(event) {
      setEnabled(event.type === DEVELOPER_MODE_EVENT ? Boolean(event.detail) : getDeveloperMode());
    }
    window.addEventListener(DEVELOPER_MODE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DEVELOPER_MODE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function update(nextEnabled) {
    setDeveloperMode(nextEnabled);
    setEnabled(Boolean(nextEnabled));
  }

  return [enabled, update];
}
