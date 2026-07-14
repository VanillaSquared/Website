import { notFound } from "next/navigation";

import { getAuthSubject } from "@/app/auth";
import { PERMISSIONS, getAuthorizationForUser, hasResolvedPermission } from "@/auth/permissions";
import { getBugStatusCheckmarkProps } from "@/bugs/checkmark";
import { listComments } from "@/bugs/comments";
import { getBugLimitConfig } from "@/bugs/limits";
import { BUG_REPORT_CATEGORY_CONFIGS, BUG_REPORT_PRIORITIES, BUG_REPORT_STATUSES, getBugReportByPublicId } from "@/bugs/reporter";
import AttachmentList from "@/components/AttachmentList";
import Checkmark from "@/components/Checkmark";
import CommentThread from "@/components/CommentThread";
import Tag from "@/components/Tag";
import ElementViewTemplatePage from "@/template-pages/ElementViewTemplatePage";
import { formatEuropeanDateTime } from "@/utils/dateTime";

import BugReportActions from "./BugReportActions";

export const dynamic = "force-dynamic";

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
  const [bug, subject, bugConfig] = await Promise.all([
    getBugReportByPublicId(decodeURIComponent(bugParam)),
    getAuthSubject({ updateTokens: false }),
    getBugLimitConfig(),
  ]);

  if (!bug) {
    notFound();
  }

  const user = subject?.properties ?? null;
  const authorization = user?.id ? await getAuthorizationForUser(user) : null;
  const canManage = authorization ? hasResolvedPermission(authorization, PERMISSIONS.MANAGE_BUGS) : false;
  const canUseBugPanel = authorization ? hasResolvedPermission(authorization, PERMISSIONS.BUG_PANEL) : false;
  const lockdownBlocked = bugConfig.lockdownEnabled && !canUseBugPanel;
  const canEdit = !lockdownBlocked && (canManage || canUseBugPanel || Boolean(
    authorization
    && bug.creatorUserId === user.id
    && hasResolvedPermission(authorization, PERMISSIONS.EDIT_BUGS)
  ));
  const canToggleComments = Boolean(!lockdownBlocked && authorization && (
    bug.creatorUserId === user.id
    || canUseBugPanel
  ));
  const comments = await listComments(bug.publicId, user?.id ?? null);
  const canWriteComments = Boolean(authorization && hasResolvedPermission(authorization, PERMISSIONS.WRITE_COMMENTS));
  const canManageComments = Boolean(authorization && hasResolvedPermission(authorization, PERMISSIONS.MANAGE_COMMENTS));
  const categoryLabel = categoryLabels[bug.category] ?? bug.category;
  const affectedVersions = bug.affectedVersions?.length ? bug.affectedVersions.join(", ") : "Unknown";
  const editableVersions = [...new Set([...bugConfig.affectedVersions, ...(bug.affectedVersions ?? []), ...(bug.fixedVersion ? [bug.fixedVersion] : [])])];
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
              versions={editableVersions}
              priorities={BUG_REPORT_PRIORITIES}
              statuses={BUG_REPORT_STATUSES}
              creatorUser={user}
              canEdit={canEdit}
              canEditState={canUseBugPanel}
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
          canWrite={canWriteComments && !lockdownBlocked}
          canManage={canManageComments}
          allowComments={bug.allowComments}
          interactionLocked={lockdownBlocked}
          commentCharacterLimit={bugConfig.commentCharacterLimit}
          bypassCharacterLimit={Boolean(authorization && hasResolvedPermission(authorization, PERMISSIONS.BYPASS_LIMITS))}
        />
      </section>
    </ElementViewTemplatePage>
  );
}
