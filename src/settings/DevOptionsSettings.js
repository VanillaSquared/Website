"use client";

import Toggle from "@/components/Toggle";
import useDeveloperMode from "@/hooks/useDeveloperMode";

export default function DevOptionsSettings() {
  const [developerMode, setDeveloperMode] = useDeveloperMode();

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-base font-semibold text-heading">Developer mode</h2>
      <Toggle
        label="Enable developer mode"
        description="Show developer-only interface controls, including copying comment IDs from comment actions."
        checked={developerMode}
        onChange={setDeveloperMode}
      />
    </div>
  );
}
