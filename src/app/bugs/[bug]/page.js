import { notFound } from "next/navigation";

import { getBugStatusCheckmarkProps } from "@/bugs/checkmark";
import { getBugReportById, getBugReportComments } from "@/bugs/server";
import BugMarkdown from "@/components/BugMarkdown";
import ChatBox from "@/components/ChatBox";
import Checkmark from "@/components/Checkmark";
import Tag from "@/components/Tag";
import ElementViewTemplatePage from "@/template-pages/ElementViewTemplatePage";
import { formatEuropeanDateTime } from "@/utils/dateTime";

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

const priorityDetailColors = {
  Low: "text-[var(--vsq-tag-low-text)]",
  Medium: "text-[var(--vsq-tag-medium-text)]",
  High: "text-[var(--vsq-tag-high-text)]",
  "Code Red": "text-[var(--vsq-tag-code-red-text)]",
  Unset: "text-muted",
};

const statusDetailColors = {
  Fixed: "text-[var(--vsq-filter-status-fixed)]",
  Unconfirmed: "text-[var(--vsq-filter-status-unconfirmed)]",
  Confirmed: "text-[var(--vsq-filter-status-confirmed)]",
  "Works as intended": "text-[var(--vsq-filter-status-intended)]",
  "Vanilla bug": "text-[var(--vsq-filter-status-vanilla)]",
};

function formatDate(value) {
  return formatEuropeanDateTime(value, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }, "Unknown").replace(/^(\d{1,2}) /, "$1. ");
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { bug: bugParam } = await params;
  const bug = await getBugReportById(decodeURIComponent(bugParam)).catch(() => null);
  if (!bug) return { title: "Bug not found | Vanilla²" };

  return {
    title: `${bug.publicId.toUpperCase()} | Vanilla² Bugs`,
    description: bug.title,
  };
}

export default async function BugViewPage({ params }) {
  const { bug: bugParam } = await params;
  const bug = await getBugReportById(decodeURIComponent(bugParam)).catch(() => null);
  if (!bug) notFound();

  const comments = await getBugReportComments(bug.id).catch(() => []);
  const categoryLabel = categoryLabels[bug.category] ?? bug.category;

  const commentsSection = (
    <section className="space-y-3">
      {comments.map((comment) => (
        <ChatBox
          key={comment.id}
          author={comment.author}
          avatarUrl={comment.avatarUrl}
          authorUrl={comment.authorUrl}
          createdAt={comment.createdAt}
          edited={comment.updatedAt !== comment.createdAt}
        >
          <BugMarkdown source={comment.source} />
        </ChatBox>
      ))}
    </section>
  );

  return (
    <ElementViewTemplatePage
      backHref="/bugs"
      backLabel="All bugs"
      className="py-8"
      articleClassName="border-0"
      headerClassName="border-b-0 pb-3"
      detailsCardClassName="!border-0"
      contentClassName="pt-1"
      eyebrow={bug.publicId.toUpperCase()}
      afterArticle={commentsSection}
      title={(
        <span className="flex items-start gap-3">
          <Checkmark {...getBugStatusCheckmarkProps(bug)} size="lg" className="mt-1" />
          <span>{bug.title}</span>
        </span>
      )}
      meta={[
        { label: "Category", value: categoryLabel, className: "text-accent" },
        { label: "Priority", value: priorityLabels[bug.priority] ?? bug.priority, className: priorityDetailColors[bug.priority] ?? "text-muted" },
        { label: "Status", value: bug.status, className: statusDetailColors[bug.status] ?? "text-heading" },
        { label: "Minecraft version", value: bug.minecraftVersion, className: "text-soft" },
        { label: "Mod version", value: bug.modVersion, className: "text-soft" },
        { label: "Operating system", value: bug.operatingSystem, className: "text-soft" },
        { label: "Created", value: formatDate(bug.createdAt), className: "text-muted" },
      ]}
    >
      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          <Tag variant="subtle">{categoryLabel}</Tag>
          <Tag variant={priorityVariants[bug.priority] ?? "subtle"}>{priorityLabels[bug.priority] ?? bug.priority}</Tag>
          <Tag variant="accent">{bug.status}</Tag>
        </div>
        <BugMarkdown source={bug.source} />
      </section>
    </ElementViewTemplatePage>
  );
}
