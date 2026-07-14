import { notFound } from "next/navigation";

import { getAuthSubject } from "@/app/auth";
import { PERMISSIONS, getAuthorizationForUser, hasResolvedPermission } from "@/auth/permissions";
import { getBugStatusCheckmarkProps } from "@/bugs/checkmark";
import { listComments } from "@/bugs/comments";
import { BUG_REPORT_CATEGORY_CONFIGS, BUG_REPORT_VERSIONS, getBugReportByPublicId } from "@/bugs/reporter";
import AttachmentList from "@/components/AttachmentList";
import Checkmark from "@/components/Checkmark";
import CommentThread from "@/components/CommentThread";
import Tag from "@/components/Tag";
import ElementViewTemplatePage from "@/template-pages/ElementViewTemplatePage";

import BugReportActions from "./BugReportActions";

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
  const [bug, subject] = await Promise.all([
    getBugReportByPublicId(decodeURIComponent(bugParam)),
    getAuthSubject({ updateTokens: false }),
  ]);

  if (!bug) {
    notFound();
  }

  const user = subject?.properties ?? null;
  const authorization = user?.id ? await getAuthorizationForUser(user) : null;
  const canManage = authorization ? hasResolvedPermission(authorization, PERMISSIONS.MANAGE_BUGS) : false;
  const canEdit = canManage || Boolean(
    authorization
    && bug.creatorUserId === user.id
    && hasResolvedPermission(authorization, PERMISSIONS.EDIT_BUGS)
  );
  const canToggleComments = Boolean(authorization && (
    bug.creatorUserId === user.id
    || hasResolvedPermission(authorization, PERMISSIONS.BUG_PANEL)
  ));
  const comments = await listComments(bug.publicId);
  const canWriteComments = Boolean(authorization && hasResolvedPermission(authorization, PERMISSIONS.WRITE_COMMENTS));
  const canManageComments = Boolean(authorization && hasResolvedPermission(authorization, PERMISSIONS.MANAGE_COMMENTS));
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Tag variant="subtle">{categoryLabel}</Tag>
            <Tag variant={priorityVariants[bug.priority] ?? "subtle"}>{bug.priority}</Tag>
            <Tag variant="accent">{bug.status}</Tag>
          </div>
          {canEdit || canManage || canToggleComments ? (
            <BugReportActions
              report={bug}
              categories={BUG_REPORT_CATEGORY_CONFIGS}
              versions={BUG_REPORT_VERSIONS}
              creatorUser={user}
              canEdit={canEdit}
              canDelete={canManage}
              canToggleComments={canToggleComments}
            />
          ) : null}
        </div>
        <p className="whitespace-pre-wrap text-base leading-6 text-soft">{bug.description}</p>
        <div className="-mx-5 h-px bg-divider sm:-mx-7" />
        <AttachmentList files={bug.files} bugPublicId={bug.publicId} />
        <div className="-mx-5 h-px bg-divider sm:-mx-7" />
        <CommentThread
          publicId={bug.publicId}
          initialComments={comments}
          currentUserId={user?.id ?? null}
          canWrite={canWriteComments}
          canManage={canManageComments}
          allowComments={bug.allowComments}
        />
      </section>
    </ElementViewTemplatePage>
  );
}
