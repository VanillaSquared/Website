"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import xIcon from "@/assets/icons/x.svg";
import Button from "@/components/Button";
import Checkmark from "@/components/Checkmark";
import Modal from "@/components/Modal";
import Separator from "@/components/Separator";

function FilterGroup({ label, name, value, options, onChange }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-heading">{label}</h3>
      <div className="mt-2 space-y-1">
        {options.map((option) => {
          const checked = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(name, checked ? "" : option.value)}
              className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-left text-sm text-soft transition-colors hover:bg-control-hover/60 focus-visible:bg-control-hover focus-visible:outline-none"
            >
              <Checkmark checked={checked} size="sm" />
              <span>{option.label}</span>
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

    if (value) {
      nextParams.set(name, value);
    } else {
      nextParams.delete(name);
    }

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
      <Button variant="tertiary" onClick={() => setOpen(true)}>Filters</Button>
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

          <div className="flex-1 overflow-y-auto py-6">
            <FilterGroup
              label="Category"
              name="category"
              value={searchParams.get("category") ?? ""}
              options={categories.map((category) => ({ value: category.slug, label: category.label }))}
              onChange={updateFilter}
            />
            <Separator className="my-5" />
            <FilterGroup
              label="Priority"
              name="priority"
              value={searchParams.get("priority") ?? ""}
              options={priorities.map((priority) => ({ value: priority, label: priority }))}
              onChange={updateFilter}
            />
            <Separator className="my-5" />
            <FilterGroup
              label="Status"
              name="status"
              value={searchParams.get("status") ?? ""}
              options={statuses.map((status) => ({ value: status, label: status }))}
              onChange={updateFilter}
            />
          </div>

          <div className="border-t border-divider pt-4">
            <Button className="w-full" variant="tertiary" onClick={clearFilters} disabled={isPending}>Clear filters</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
