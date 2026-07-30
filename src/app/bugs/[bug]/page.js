import { notFound } from "next/navigation";

import { getBugStatusCheckmarkProps } from "@/bugs/checkmark";
import { getBugReportByPublicId, getBugReports } from "@/bugs/server";
import Checkmark from "@/components/Checkmark";
import MarkdownContent from "@/markdown/MarkdownContent";
import Tag from "@/components/Tag";
import ElementViewTemplatePage from "@/template-pages/ElementViewTemplatePage";
import { formatEuropeanDateTime } from "@/utils/dateTime";

const categoryLabels = {
  "vanilla-squared": "Vanilla Squared",
  website: "Website",
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
  return formatEuropeanDateTime(value, { dateStyle: "medium", timeStyle: "short" }, "Unknown");
}

export function generateStaticParams() {
  return getBugReports().map((bug) => ({ bug: bug.publicId }));
}

export async function generateMetadata({ params }) {
  const { bug: bugParam } = await params;
  const bug = getBugReportByPublicId(decodeURIComponent(bugParam));
  if (!bug) return { title: "Bug not found | Vanilla²" };

  return {
    title: `${bug.publicId} | Vanilla² Bugs`,
    description: bug.title,
  };
}

export default async function BugViewPage({ params }) {
  const { bug: bugParam } = await params;
  const bug = getBugReportByPublicId(decodeURIComponent(bugParam));
  if (!bug) notFound();

  const categoryLabel = categoryLabels[bug.category] ?? bug.category;
  const affectedVersions = bug.affectedVersions.length ? bug.affectedVersions.join(", ") : "Unknown";

  return (
    <ElementViewTemplatePage
      backHref="/bugs"
      backLabel="All bugs"
      className="py-8"
      eyebrow={bug.publicId}
      title={(
        <span className="flex items-start gap-3">
          <Checkmark {...getBugStatusCheckmarkProps(bug)} size="lg" className="mt-1" />
          <span>{bug.title}</span>
        </span>
      )}
      meta={[
        { label: "Reporter", value: bug.creatorUsername, className: "text-soft" },
        { label: "Category", value: categoryLabel, className: "text-accent" },
        { label: "Priority", value: bug.priority, className: priorityDetailColors[bug.priority] ?? "text-muted" },
        { label: "Status", value: bug.status, className: statusDetailColors[bug.status] ?? "text-heading" },
        { label: "Affected versions", value: affectedVersions, className: "text-soft" },
        { label: "Fixed version", value: bug.fixedVersion ?? (bug.fixed ? "Unknown" : "Not fixed"), className: bug.fixed || bug.fixedVersion ? "text-[var(--vsq-filter-status-fixed)]" : "text-muted" },
        { label: "Created", value: formatDate(bug.createdAt), className: "text-muted" },
      ]}
    >
      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          <Tag variant="subtle">{categoryLabel}</Tag>
          <Tag variant={priorityVariants[bug.priority] ?? "subtle"}>{bug.priority}</Tag>
          <Tag variant="accent">{bug.status}</Tag>
        </div>
        <div className="-mx-5 h-px bg-divider sm:-mx-7" />
        <MarkdownContent source={bug.source} basePath="/bugs" />
      </section>
    </ElementViewTemplatePage>
  );
}
