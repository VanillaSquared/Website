"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import editIcon from "@/assets/icons/edit.svg";
import xIcon from "@/assets/icons/x.svg";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import Toggle from "@/components/Toggle";

import BugReporterForm from "../BugReporterForm";

export default function BugReportActions({ report, categories, versions, creatorUser, canEdit, canDelete, canToggleComments = false }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [allowComments, setAllowComments] = useState(report.allowComments);
  const [commentsStatus, setCommentsStatus] = useState(null);
  const [savingComments, setSavingComments] = useState(false);

  function handleUpdated(result) {
    setEditOpen(false);
    if (result.publicId && result.publicId.toLowerCase() !== report.publicId.toLowerCase()) {
      router.replace(`/bugs/${encodeURIComponent(result.publicId)}`);
    } else {
      router.refresh();
    }
  }

  async function saveCommentsSetting() {
    setSavingComments(true);
    setCommentsStatus(null);
    try {
      const response = await fetch(`/api/bugs/${encodeURIComponent(report.publicId)}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowComments }),
      });
      const result = await response.json();
      if (!response.ok) {
        setCommentsStatus(result.error ?? "Failed to update comments setting.");
        return;
      }
      setCommentsOpen(false);
      router.refresh();
    } catch {
      setCommentsStatus("Failed to update comments setting.");
    } finally {
      setSavingComments(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteStatus(null);
    try {
      const response = await fetch(`/api/bugs/${encodeURIComponent(report.publicId)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const result = await response.json();
      if (!response.ok) {
        setDeleteStatus(result.error ?? "Failed to delete bug report.");
        return;
      }
      router.replace("/bugs");
      router.refresh();
    } catch {
      setDeleteStatus("Failed to delete bug report.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canEdit ? (
          <Button variant="tertiary" size="sm" icon={editIcon} onClick={() => setEditOpen(true)}>Edit</Button>
        ) : null}
        {canToggleComments && !canEdit ? (
          <Button variant="tertiary" size="sm" onClick={() => setCommentsOpen(true)}>Comments</Button>
        ) : null}
        {canDelete ? (
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>Delete</Button>
        ) : null}
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} variant="wide" className="!p-0">
        <div className="flex flex-col">
          <div className="flex items-start justify-between border-b border-divider px-5 py-3">
            <div>
              <h2 className="text-lg font-semibold text-heading">Edit bug report</h2>
              <p className="mt-0.5 text-sm text-muted">Update {report.publicId.toLowerCase()}.</p>
            </div>
            <Button size="icon" variant="tertiary" icon={xIcon} aria-label="Close edit bug report" onClick={() => setEditOpen(false)} />
          </div>
          <div className="p-4">
            <BugReporterForm
              mode="edit"
              report={report}
              categories={categories}
              versions={versions}
              authenticated
              creatorUser={creatorUser}
              onUpdated={handleUpdated}
            />
          </div>
        </div>
      </Modal>

      <Modal open={commentsOpen} onClose={() => !savingComments && setCommentsOpen(false)} variant="compact">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-heading">Comment settings</h2>
          <Toggle
            label="Allow comments"
            description="Existing comments remain visible and manageable when disabled."
            checked={allowComments}
            onChange={setAllowComments}
            disabled={savingComments}
          />
          {commentsStatus ? <p className="text-sm text-error">{commentsStatus}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="tertiary" size="sm" disabled={savingComments} onClick={() => setCommentsOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={savingComments} onClick={saveCommentsSetting}>{savingComments ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)} variant="compact" closeOnOutsideClick={!deleting} className="!p-0">
        <div className="p-5">
          <h2 className="text-lg font-semibold text-heading">Delete bug report?</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {report.publicId.toLowerCase()} and all of its attachments will be permanently deleted.
          </p>
          {deleteStatus ? <p className="mt-3 text-sm text-error">{deleteStatus}</p> : null}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="tertiary" size="sm" disabled={deleting} onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" size="sm" disabled={deleting} onClick={handleDelete}>{deleting ? "Deleting..." : "Delete"}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
