"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { getBugStatusCheckmarkProps } from "@/bugs/checkmark";
import Checkmark from "@/components/Checkmark";
import Tag from "@/components/Tag";

const categoryLabels = {
  "vanilla-squared": "Mod",
  website: "Website",
};

const priorityLabels = {
  "Code Red": "Urgent",
  unset: "None",
};

const priorityVariants = {
  Low: "low",
  Medium: "medium",
  High: "high",
  "Code Red": "codeRed",
  unset: "subtle",
};

function getDescriptionPreview(description) {
  return description?.split("\n")[0] ?? "";
}

export default function BugList({ bugs }) {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);

  const handleScroll = useCallback(() => {
    setIsScrolling(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      scrollTimeoutRef.current = null;
    }, 700);
  }, []);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  if (!bugs.length) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-lg font-semibold text-heading">No bugs found</p>
        <p className="mt-2 text-sm text-muted">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-20rem)] min-h-64">
      <div
        className={`scrollbar-while-scrolling h-full space-y-2 overflow-y-auto ${isScrolling ? "is-scrolling" : ""}`}
        onScroll={handleScroll}
      >
        {bugs.map((bug) => (
          <div key={bug.publicId}>
            <Link
              href={`/bugs/${bug.publicId}`}
              className="block cursor-pointer rounded-xl bg-card py-3 pl-4 pr-12 transition-colors hover:bg-control-hover/60 focus-visible:bg-control-hover focus-visible:outline-none"
              aria-label={`View bug ${bug.publicId.toUpperCase()}: ${bug.title}`}
            >
              <article className="flex gap-3">
                <Checkmark {...getBugStatusCheckmarkProps(bug)} className="mt-1" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-accent">{bug.publicId?.toUpperCase()}</span>
                      <Tag variant="subtle">{categoryLabels[bug.category] ?? bug.category}</Tag>
                      <Tag variant={priorityVariants[bug.priority] ?? "subtle"}>{priorityLabels[bug.priority] ?? bug.priority}</Tag>
                      <Tag variant="accent">{bug.status}</Tag>
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-heading">{bug.title}</h2>
                      <p className="mt-1 truncate text-sm leading-5 text-muted">{getDescriptionPreview(bug.description)}</p>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
