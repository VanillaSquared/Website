"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Button from "@/components/Button";
import MultiSelect from "@/components/MultiSelect";
import SearchBar from "@/components/SearchBar";
import Separator from "@/components/Separator";

async function request(options) {
  const response = await fetch("/api/experiments", {
    cache: "no-store",
    credentials: "same-origin",
    headers: options?.body ? { "Content-Type": "application/json" } : undefined,
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Could not load experiments.");
  return data;
}

function formatTreatment(treatment) {
  return treatment
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function ExperimentRow({ experiment, assignment, busy, onTreatmentChange, onReset }) {
  const disabledPercentage = Math.max(0, 100 - experiment.rolloutPercentage);
  const options = [
    ...experiment.treatments.map((treatment) => ({ value: treatment.id, label: formatTreatment(treatment.id) })),
    { value: "disabled", label: "Disabled" },
  ];
  const allocation = [
    ...experiment.treatments.map((treatment) => `${formatTreatment(treatment.id)} ${treatment.percentage}%`),
    `Disabled ${disabledPercentage}%`,
  ].join(" · ");

  return (
    <article className="px-4 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-heading">{experiment.id}</h3>
          <p className="mt-1 text-sm text-muted">
            {experiment.rolloutPercentage}% total rollout · {allocation}
          </p>
        </div>
        <div className="w-full shrink-0 lg:w-64">
          <MultiSelect
            multiple={false}
            label="Effective treatment"
            options={options}
            value={assignment?.treatment ?? "disabled"}
            onChange={onTreatmentChange}
            locked={busy}
            showLimitText={false}
            className="w-full text-xs"
          />
          <div className="mt-2 flex min-h-8 items-center justify-between gap-2">
            <span className="text-xs text-subtle">{assignment?.source ?? "rollout"}</span>
            {assignment?.source === "override" ? (
              <Button size="sm" variant="tertiary" disabled={busy} onClick={onReset}>Reset to automatic</Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function ExperimentsSettings() {
  const [search, setSearch] = useState("");
  const [experiments, setExperiments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await request();
      setExperiments(Array.isArray(data.experiments) ? data.experiments : []);
      setAssignments(Array.isArray(data.assignments) ? data.assignments : []);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visibleExperiments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return experiments;
    return experiments.filter((experiment) => (
      experiment.id.toLowerCase().includes(query)
      || experiment.treatments.some((treatment) => treatment.id.toLowerCase().includes(query))
    ));
  }, [experiments, search]);
  const assignmentMap = useMemo(() => new Map(assignments.map((assignment) => [assignment.experimentId, assignment])), [assignments]);

  async function updateOverride(experimentId, treatment) {
    setBusyId(experimentId);
    setError("");
    try {
      const data = await request({ method: "PATCH", body: JSON.stringify({ experimentId, treatment }) });
      setAssignments((current) => [...current.filter((item) => item.experimentId !== experimentId), data.assignment]);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col text-soft">
      <SearchBar variant="settings" className="mb-4 shrink-0" placeholder="Search experiments" value={search} onChange={setSearch} showPreview={false} />
      {error ? <p className="mb-3 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300">{error}</p> : null}
      <div className="relative min-h-64 flex-1 before:absolute before:top-0 before:-left-4 before:-right-4 before:h-px before:bg-separator after:absolute after:bottom-0 after:-left-4 after:-right-4 after:h-px after:bg-separator">
        <div className="h-full overflow-y-auto pb-6 [scrollbar-gutter:stable]">
          {visibleExperiments.map((experiment, index) => (
            <div key={experiment.id}>
              {index > 0 ? <Separator /> : null}
              <ExperimentRow
                experiment={experiment}
                assignment={assignmentMap.get(experiment.id)}
                busy={busyId === experiment.id}
                onTreatmentChange={(treatment) => updateOverride(experiment.id, treatment)}
                onReset={() => updateOverride(experiment.id, null)}
              />
            </div>
          ))}
          {!visibleExperiments.length && !loading ? <p className="py-10 text-center text-sm text-muted">No experiments found.</p> : null}
          {loading ? <p className="py-10 text-center text-sm text-muted">Loading experiments...</p> : null}
        </div>
      </div>
    </div>
  );
}
