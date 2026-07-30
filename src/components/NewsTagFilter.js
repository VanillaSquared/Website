"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import Checkmark from "@/components/Checkmark";

export default function NewsTagFilter({ options = [], value = [] }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedTags, setSelectedTags] = useState(value);
  const [isPending, startTransition] = useTransition();

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

  return (
    <div
      role="group"
      aria-label="Filter news by tags"
      className="ml-4 flex max-h-10 w-max max-w-[40vw] flex-wrap items-center gap-x-3 gap-y-1 overflow-hidden"
    >
      {options.map((option) => {
        const checked = selectedTags.includes(option.value);

        return (
          <span key={option.value} className="flex items-center gap-1.5 text-xs font-medium text-soft">
            <Checkmark
              checked={checked}
              onChange={(nextChecked) => updateTag(option.value, nextChecked)}
              disabled={isPending}
              size="sm"
              aria-label={`${checked ? "Remove" : "Add"} ${option.label} filter`}
            />
            <span className="hidden xl:inline">{option.label}</span>
          </span>
        );
      })}
    </div>
  );
}
