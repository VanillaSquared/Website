"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import filterIcon from "@/assets/icons/filter.svg";
import xIcon from "@/assets/icons/x.svg";
import Button from "@/components/Button";
import Checkmark from "@/components/Checkmark";
import Modal from "@/components/Modal";
import Separator from "@/components/Separator";

const filterTextColors = {
  priority: {
    Low: "text-[var(--vsq-tag-low-text)]",
    Medium: "text-[var(--vsq-tag-medium-text)]",
    High: "text-[var(--vsq-tag-high-text)]",
    "Code Red": "text-[var(--vsq-tag-code-red-text)]",
    unset: "text-muted",
  },
  status: {
    Fixed: "text-[var(--vsq-filter-status-fixed)]",
    Unfixable: "text-[var(--vsq-filter-status-unfixable)]",
    Unconfirmed: "text-[var(--vsq-filter-status-unconfirmed)]",
    Confirmed: "text-[var(--vsq-filter-status-confirmed)]",
    "Works as intended": "text-[var(--vsq-filter-status-intended)]",
    "Vanilla bug": "text-[var(--vsq-filter-status-vanilla)]",
  },
};

function FilterGroup({ label, name, values, options, onChange }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-heading">{label}</h3>
      <div className="mt-1 space-y-0.5">
        {options.map((option) => {
          const checked = values.includes(option.value);
          const textColor = filterTextColors[name]?.[option.value] ?? "text-soft";

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(name, option.value)}
              className="flex w-full items-center gap-3 rounded-lg px-1 py-1.5 text-left text-sm transition-colors hover:bg-control-hover/60 focus-visible:bg-control-hover focus-visible:outline-none"
            >
              <Checkmark checked={checked} size="sm" />
              <span className={textColor}>{option.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function BugFilterSidebar({ categories, priorities, statuses }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function updateFilter(name, value) {
    const nextParams = new URLSearchParams(searchParams.toString());
    const values = nextParams.getAll(name);
    const nextValues = values.includes(value)
      ? values.filter((filterValue) => filterValue !== value)
      : [...values, value];

    nextParams.delete(name);
    nextValues.forEach((filterValue) => nextParams.append(name, filterValue));

    startTransition(() => {
      router.push(`/bugs${nextParams.toString() ? `?${nextParams.toString()}` : ""}`);
    });
  }

  function clearFilters() {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("category");
    nextParams.delete("priority");
    nextParams.delete("status");

    startTransition(() => {
      router.push(`/bugs${nextParams.toString() ? `?${nextParams.toString()}` : ""}`);
    });
  }

  return (
    <>
      <Button
        variant="iconButton"
        size="iconButton"
        icon={filterIcon}
        iconClassName="h-5 w-5"
        aria-label="Filters"
        title="Filters"
        onClick={() => setOpen(true)}
      />
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        variant="filterSidebar"
        background="none"
        blurBackground={false}
        closeOnOutsideClick={false}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-divider pb-4">
            <div>
              <h2 className="text-xl font-semibold text-heading">Filters</h2>
              <p className="mt-1 text-sm text-muted">Narrow the bug list.</p>
            </div>
            <Button
              size="icon"
              variant="tertiary"
              icon={xIcon}
              aria-label="Close filters"
              onClick={() => setOpen(false)}
            />
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <FilterGroup
              label="Category"
              name="category"
              values={searchParams.getAll("category")}
              options={categories.map((category) => ({ value: category.slug, label: category.label }))}
              onChange={updateFilter}
            />
            <Separator className="my-3" />
            <FilterGroup
              label="Priority"
              name="priority"
              values={searchParams.getAll("priority")}
              options={priorities.map((priority) => ({ value: priority, label: priority }))}
              onChange={updateFilter}
            />
            <Separator className="my-3" />
            <FilterGroup
              label="Status"
              name="status"
              values={searchParams.getAll("status")}
              options={statuses.map((status) => ({ value: status, label: status }))}
              onChange={updateFilter}
            />
          </div>

          <div className="border-t border-divider pt-3">
            <Button className="w-full" variant="tertiary" onClick={clearFilters} disabled={isPending}>Clear filters</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
