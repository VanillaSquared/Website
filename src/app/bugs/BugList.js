"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import Checkmark from "@/components/Checkmark";
import Separator from "@/components/Separator";
import Tag from "@/components/Tag";

const categoryLabels = {
  "vanilla-squared": "Vanilla Squared",
  website: "Website",
  test: "Test",
};

const priorityVariants = {
  Low: "low",
  Medium: "medium",
  High: "high",
  "Code Red": "codeRed",
  unset: "subtle",
};

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
      <div className="border-y border-divider px-4 py-8 text-center">
        <p className="text-lg font-semibold text-heading">No bugs found</p>
        <p className="mt-2 text-sm text-muted">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100dvh-20rem)] min-h-64 before:absolute before:top-0 before:-left-4 before:-right-4 before:h-px before:bg-separator after:absolute after:bottom-0 after:-left-4 after:-right-4 after:h-px after:bg-separator">
      <div
        className={`scrollbar-while-scrolling h-full overflow-y-auto ${isScrolling ? "is-scrolling" : ""}`}
        onScroll={handleScroll}
      >
        {bugs.map((bug, index) => (
        <div key={bug.id}>
          {index > 0 ? <Separator /> : null}
          <Link
            href={`/bugs/${bug.publicId}`}
            className="block cursor-pointer px-4 py-3 transition-colors hover:bg-control-hover/60 focus-visible:bg-control-hover focus-visible:outline-none"
            aria-label={`View bug ${bug.publicId}: ${bug.title}`}
          >
            <article className="flex gap-3">
              <Checkmark checked variant="green" className="mt-1" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-accent">{bug.publicId?.toLowerCase()}</span>
                    <Tag variant="subtle">{categoryLabels[bug.category] ?? bug.category}</Tag>
                    <Tag variant={priorityVariants[bug.priority] ?? "subtle"}>{bug.priority}</Tag>
                    <Tag variant="accent">{bug.status}</Tag>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-heading">{bug.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted">{bug.description}</p>
                  </div>
                </div>
                <p className="mt-2 truncate text-xs text-subtle">Creator: {bug.creatorUsername ?? "Unknown"}</p>
              </div>
            </article>
          </Link>
        </div>
        ))}
      </div>
    </div>
  );
}
