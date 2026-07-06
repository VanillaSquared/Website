import { notFound } from "next/navigation";

import { getBugReportByPublicId } from "@/bugs/reporter";
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
    title: `${bug.publicId?.toUpperCase()} | Vanilla² Bugs`,
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

  return (
    <ElementViewTemplatePage
      routeSegments={[
        { label: "bugs", href: "/bugs" },
        { label: bug.publicId?.toUpperCase() ?? "BUG" },
      ]}
      backHref="/bugs"
      backLabel="All bugs"
      eyebrow={bug.publicId?.toLowerCase()}
      title={bug.title}
      subtitle={`Reported by ${bug.creatorUsername ?? "Unknown"}`}
      badges={(
        <>
          <Tag variant="subtle">{categoryLabel}</Tag>
          <Tag variant={priorityVariants[bug.priority] ?? "subtle"}>{bug.priority}</Tag>
          <Tag variant="accent">{bug.status}</Tag>
        </>
      )}
      meta={[
        { label: "Route", value: `/bugs/${bug.publicId}` },
        { label: "Category", value: categoryLabel },
        { label: "Priority", value: bug.priority },
        { label: "Status", value: bug.status },
        { label: "Affected versions", value: affectedVersions },
        { label: "Fixed version", value: bug.fixedVersion ?? (bug.fixed ? "Unknown" : "Not fixed") },
        { label: "Created", value: formatDate(bug.createdAt) },
        { label: "Updated", value: formatDate(bug.updatedAt) },
      ]}
      aside={(
        <section className="rounded-2xl border border-divider bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Attachments</h2>
          {bug.files?.length ? (
            <ul className="mt-4 space-y-2">
              {bug.files.map((file) => (
                <li key={file.id} className="rounded-xl border border-divider bg-control px-3 py-2">
                  <p className="truncate text-sm font-semibold text-soft">{file.originalName}</p>
                  <p className="mt-1 text-xs text-muted">{formatBytes(file.sizeBytes)} · {file.extension}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">No attachments were uploaded.</p>
          )}
        </section>
      )}
    >
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Description</h2>
        <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-soft">{bug.description}</p>
      </section>
    </ElementViewTemplatePage>
  );
}
