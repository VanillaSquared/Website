import Link from "next/link";

import { getBugStatusCheckmarkProps } from "@/bugs/checkmark";
import Checkmark from "@/components/Checkmark";
import Tag from "@/components/Tag";

const categoryLabels = {
  "vanilla-squared": "Mod",
  website: "Website",
};

const priorityLabels = {
  "Code Red": "Urgent",
  Unset: "None",
};

const priorityVariants = {
  Low: "low",
  Medium: "medium",
  High: "high",
  "Code Red": "codeRed",
  Unset: "subtle",
};

function getDescriptionPreview(description) {
  return description?.split("\n")[0] ?? "";
}

export default function BugList({ bugs }) {
  if (!bugs.length) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-lg font-semibold text-heading">No bugs found</p>
        <p className="mt-2 text-sm text-muted">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {bugs.map((bug) => (
        <div key={bug.publicId}>
          <Link
            href={`/bugs/${bug.id}`}
            className="block cursor-pointer rounded-xl bg-card py-3 pl-4 pr-12 transition-colors hover:bg-control-hover/60 focus-visible:bg-control-hover focus-visible:outline-none"
            aria-label={`View ${bug.publicId.toUpperCase()}: ${bug.title}`}
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
  );
}
