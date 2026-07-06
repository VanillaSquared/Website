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
  if (!bugs.length) {
    return (
      <div className="border-y border-divider px-4 py-8 text-center">
        <p className="text-lg font-semibold text-heading">No bugs found</p>
        <p className="mt-2 text-sm text-muted">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto border-y border-divider">
      {bugs.map((bug, index) => (
        <div key={bug.id}>
          {index > 0 ? <Separator /> : null}
          <article className="cursor-pointer px-4 py-3 transition-colors hover:bg-control-hover/60">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold uppercase text-accent">{bug.publicId}</span>
                  <Tag variant="subtle">{categoryLabels[bug.category] ?? bug.category}</Tag>
                </div>
                <h2 className="mt-2 text-base font-semibold text-heading">{bug.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted">{bug.description}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                <Tag variant={priorityVariants[bug.priority] ?? "subtle"}>{bug.priority}</Tag>
                <Tag variant="accent">{bug.status}</Tag>
              </div>
            </div>
            <p className="mt-2 truncate text-xs text-subtle">Creator: {bug.creatorUsername ?? "Unknown"}</p>
          </article>
        </div>
      ))}
    </div>
  );
}
