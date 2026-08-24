"use client";

import { useEffect, useState } from "react";

import closeIcon from "@cdn/icons/x.svg";
import filterIcon from "@cdn/icons/filter.svg";
import Button from "@/components/Button";
import Checkmark from "@/components/Checkmark";
import Modal from "@/components/Modal";

export default function NewsTagFilter({ options = [], value = [] }) {
  const [selectedTags, setSelectedTags] = useState(value);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  useEffect(() => {
    const validTags = new Set(options.map((option) => option.value));
    const syncFromLocation = () => {
      const tags = [...new Set(new URLSearchParams(window.location.search).getAll("tag"))]
        .filter((tag) => validTags.has(tag));
      setSelectedTags(tags);
    };

    setSelectedTags(value);
    syncFromLocation();
    window.addEventListener("popstate", syncFromLocation);
    return () => window.removeEventListener("popstate", syncFromLocation);
  }, [options, value]);

  function setTags(nextTags) {
    setSelectedTags(nextTags);

    const params = new URLSearchParams(window.location.search);
    params.delete("tag");
    nextTags.forEach((selectedTag) => params.append("tag", selectedTag));

    const query = params.toString();
    window.history.pushState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    window.dispatchEvent(new CustomEvent("news-filter-change", { detail: nextTags }));
  }

  function updateTag(tag, checked) {
    setTags(
      checked
        ? [...selectedTags, tag]
        : selectedTags.filter((selectedTag) => selectedTag !== tag)
    );
  }

  function clearFilters() {
    setTags([]);
  }

  function renderOption(option) {
    const checked = selectedTags.includes(option.value);

    return (
      <Checkmark
        key={option.value}
        checked={checked}
        onChange={(nextChecked) => updateTag(option.value, nextChecked)}
        label={option.label}
        size="sm"
        className="text-sm font-medium text-soft"
      />
    );
  }

  return (
    <>
      <div className="ml-4 shrink-0">
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
        className="!border-0"
        background="none"
        blurBackground={false}
        ariaLabelledBy="news-filter-modal-title"
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="relative shrink-0 pb-4">
            <div>
              <h2 id="news-filter-modal-title" className="text-base font-semibold text-heading">Filter news</h2>
              <p className="mt-1 text-xs text-muted">Choose one or more tags.</p>
            </div>
            <Button
              size="icon"
              variant="tertiary"
              icon={closeIcon}
              aria-label="Close news filters"
              className="absolute top-0 right-0"
              onClick={() => setFilterModalOpen(false)}
            />
          </div>

          <div role="group" aria-label="Filter news by tags" className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-4">
            {options.map(renderOption)}
          </div>

          <div className="mt-auto shrink-0 pt-3">
            <Button className="w-full" variant="tertiary" onClick={clearFilters}>Clear filters</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
