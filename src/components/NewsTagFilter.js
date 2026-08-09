"use client";

import { startTransition, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import closeIcon from "@cdn/close.svg";
import filterIcon from "@cdn/filter.svg";
import Button from "@/components/Button";
import Checkmark from "@/components/Checkmark";
import Modal from "@/components/Modal";

export default function NewsTagFilter({ options = [], value = [] }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedTags, setSelectedTags] = useState(value);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  useEffect(() => {
    setSelectedTags(value);
  }, [value]);

  function updateTag(tag, checked) {
    const nextTags = checked
      ? [...selectedTags, tag]
      : selectedTags.filter((selectedTag) => selectedTag !== tag);
    setSelectedTags(nextTags);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("tag");
    nextTags.forEach((selectedTag) => params.append("tag", selectedTag));

    const query = params.toString();
    startTransition(() => {
      router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    });
  }

  function renderOption(option) {
    const checked = selectedTags.includes(option.value);

    return (
      <span key={option.value} className="flex items-center gap-2 text-sm font-medium text-soft">
        <Checkmark
          checked={checked}
          onChange={(nextChecked) => updateTag(option.value, nextChecked)}
          size="sm"
          aria-label={`${checked ? "Remove" : "Add"} ${option.label} filter`}
        />
        <span>{option.label}</span>
      </span>
    );
  }

  return (
    <>
      <div
        role="group"
        aria-label="Filter news by tags"
        className="ml-4 hidden max-h-10 w-max max-w-[40vw] flex-wrap items-center gap-x-3 gap-y-1 overflow-hidden lg:flex"
      >
        {options.map((option) => {
          const checked = selectedTags.includes(option.value);

          return (
            <span key={option.value} className="flex items-center gap-1.5 text-xs font-medium text-soft">
              <Checkmark
                checked={checked}
                onChange={(nextChecked) => updateTag(option.value, nextChecked)}
                size="sm"
                aria-label={`${checked ? "Remove" : "Add"} ${option.label} filter`}
              />
              <span>{option.label}</span>
            </span>
          );
        })}
      </div>

      <div className="ml-4 shrink-0 lg:hidden">
        <Button
          variant="iconButton"
          size="iconButtonSm"
          icon={filterIcon}
          aria-label="Filter news"
          aria-haspopup="dialog"
          aria-expanded={filterModalOpen}
          onClick={() => setFilterModalOpen(true)}
        />
      </div>

      <Modal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        variant="filterSidebarLeft"
        ariaLabelledBy="news-filter-modal-title"
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-divider px-1 pb-4">
            <div>
              <h2 id="news-filter-modal-title" className="text-base font-semibold text-heading">Filter news</h2>
              <p className="mt-1 text-xs text-muted">Choose one or more tags.</p>
            </div>
            <Button
              variant="iconButton"
              size="iconButtonSm"
              icon={closeIcon}
              aria-label="Close news filters"
              onClick={() => setFilterModalOpen(false)}
              className="shrink-0"
            />
          </div>

          <div role="group" aria-label="Filter news by tags" className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-4">
            {options.map(renderOption)}
          </div>
        </div>
      </Modal>
    </>
  );
}
