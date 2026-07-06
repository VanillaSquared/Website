import { notFound } from "next/navigation";

import { getBugStatusCheckmarkProps } from "@/bugs/checkmark";
import { getBugReportByPublicId } from "@/bugs/reporter";
import Checkmark from "@/components/Checkmark";
import Tag from "@/components/Tag";
import ElementViewTemplatePage from "@/template-pages/ElementViewTemplatePage";

export const dynamic = "force-dynamic";

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

const priorityDetailColors = {
  Low: "text-[var(--vsq-tag-low-text)]",
  Medium: "text-[var(--vsq-tag-medium-text)]",
  High: "text-[var(--vsq-tag-high-text)]",
  "Code Red": "text-[var(--vsq-tag-code-red-text)]",
  unset: "text-muted",
};

const statusDetailColors = {
  Fixed: "text-[var(--vsq-filter-status-fixed)]",
  Unfixable: "text-[var(--vsq-filter-status-unfixable)]",
  Unconfirmed: "text-[var(--vsq-filter-status-unconfirmed)]",
  Confirmed: "text-[var(--vsq-filter-status-confirmed)]",
  "Works as intended": "text-[var(--vsq-filter-status-intended)]",
  "Vanilla bug": "text-[var(--vsq-filter-status-vanilla)]",
};

function formatDate(value) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatBytes(bytes) {
  const value = Number(bytes);

  if (!Number.isFinite(value)) {
    return "Unknown size";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export async function generateMetadata({ params }) {
  const { bug: bugParam } = await params;
  const bug = await getBugReportByPublicId(decodeURIComponent(bugParam));

  if (!bug) {
    return {
      title: "Bug not found | Vanilla²",
    };
  }

  return {
    title: `${bug.publicId?.toLowerCase()} | Vanilla² Bugs`,
    description: bug.title,
  };
}

export default async function BugViewPage({ params }) {
  const { bug: bugParam } = await params;
  const bug = await getBugReportByPublicId(decodeURIComponent(bugParam));

  if (!bug) {
    notFound();
  }

  const categoryLabel = categoryLabels[bug.category] ?? bug.category;
  const affectedVersions = bug.affectedVersions?.length ? bug.affectedVersions.join(", ") : "Unknown";
  const bugStatusCheckmark = getBugStatusCheckmarkProps(bug);

  return (
    <ElementViewTemplatePage
      backHref="/bugs"
      backLabel="All bugs"
      className="py-8"
      eyebrow={bug.publicId?.toLowerCase()}
      title={(
        <span className="flex items-start gap-3">
          <Checkmark {...bugStatusCheckmark} size="lg" className="mt-1" />
          <span>{bug.title}</span>
        </span>
      )}
      meta={[
        { label: "Reporter", value: bug.creatorUsername ?? "Unknown", className: "text-soft" },
        { label: "Category", value: categoryLabel, className: "text-accent" },
        { label: "Priority", value: bug.priority, className: priorityDetailColors[bug.priority] ?? "text-muted" },
        { label: "Status", value: bug.status, className: statusDetailColors[bug.status] ?? "text-heading" },
        { label: "Affected versions", value: affectedVersions, className: "text-soft" },
        { label: "Fixed version", value: bug.fixedVersion ?? (bug.fixed ? "Unknown" : "Not fixed"), className: bug.fixed || bug.fixedVersion ? "text-[var(--vsq-filter-status-fixed)]" : "text-muted" },
        { label: "Created", value: formatDate(bug.createdAt), className: "text-muted" },
        { label: "Updated", value: formatDate(bug.updatedAt), className: "text-muted" },
      ]}
    >
      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          <Tag variant="subtle">{categoryLabel}</Tag>
          <Tag variant={priorityVariants[bug.priority] ?? "subtle"}>{bug.priority}</Tag>
          <Tag variant="accent">{bug.status}</Tag>
        </div>
        <p className="whitespace-pre-wrap text-base leading-6 text-soft">{bug.description}</p>
        <section className="rounded-2xl border border-divider bg-control p-4 sm:p-5">
          <h2 className="text-base font-semibold text-heading">Attachments</h2>
          {bug.files?.length ? (
            <ul className="mt-4 space-y-2">
              {bug.files.map((file) => (
                <li key={file.id} className="rounded-xl border border-divider bg-card px-3 py-2">
                  <p className="truncate text-sm font-semibold text-soft">{file.originalName}</p>
                  <p className="mt-1 text-xs text-muted">{formatBytes(file.sizeBytes)} · {file.extension}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">No attachments were uploaded.</p>
          )}
        </section>
      </section>
    </ElementViewTemplatePage>
  );
}
