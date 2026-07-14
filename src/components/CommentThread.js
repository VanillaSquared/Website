"use client";

import { useState } from "react";

import Button from "@/components/Button";
import MessageComposer from "@/components/MessageComposer";
import Modal from "@/components/Modal";
import Separator from "@/components/Separator";
import ThreadRow from "@/components/ThreadRow";

async function requestJson(path, options) {
  const response = await fetch(path, { credentials: "same-origin", cache: "no-store", ...options });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Request failed.");
  return result;
}

export default function CommentThread({ publicId, initialComments = [], currentUserId = null, canWrite = false, canManage = false, allowComments = true }) {
  const [comments, setComments] = useState(initialComments);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const basePath = `/api/bugs/${encodeURIComponent(publicId)}/comments`;

  async function create(formData) {
    const result = await requestJson(basePath, { method: "POST", body: formData });
    setComments((items) => [...items, result.comment]);
  }

  function openEdit(comment) {
    setEditing(comment);
    setEditContent(comment.content);
    setError("");
  }

  async function saveEdit() {
    setBusy(true);
    setError("");
    try {
      const result = await requestJson(`${basePath}/${encodeURIComponent(editing.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      setComments((items) => items.map((item) => item.id === result.comment.id ? result.comment : item));
      setEditing(null);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    setBusy(true);
    setError("");
    try {
      await requestJson(`${basePath}/${encodeURIComponent(deleting.id)}`, { method: "DELETE" });
      setComments((items) => items.filter((item) => item.id !== deleting.id));
      setDeleting(null);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="comments-heading">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="comments-heading" className="text-lg font-semibold text-heading">Comments</h2>
        <span className="text-xs text-muted">{comments.length}</span>
      </div>
      <div className="mt-2 divide-y divide-divider">
        {comments.map((comment) => (
          <ThreadRow
            key={comment.id}
            message={comment}
            canChange={canManage || Boolean(currentUserId && comment.creatorUserId === currentUserId)}
            onEdit={() => openEdit(comment)}
            onDelete={() => { setDeleting(comment); setError(""); }}
            attachmentHref={(message) => `${basePath}/${encodeURIComponent(message.id)}/attachment/${encodeURIComponent(message.attachment.id)}`}
          />
        ))}
      </div>
      {!comments.length ? <p className="py-4 text-sm italic text-muted">No comments yet.</p> : null}
      <Separator className="mb-4" />
      <MessageComposer
        onSubmit={create}
        disabled={!allowComments || !canWrite}
        disabledMessage={!allowComments ? "New comments are disabled for this bug report." : (currentUserId ? "You do not have permission to comment." : "Log in to comment.")}
      />

      <Modal open={Boolean(editing)} onClose={() => !busy && setEditing(null)} variant="compact">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-heading">Edit comment</h2>
          <textarea
            value={editContent}
            onChange={(event) => setEditContent(event.target.value)}
            rows={5}
            maxLength={4000}
            className="w-full resize-y rounded-xl border border-input-border bg-input px-3 py-2 text-sm text-heading outline-none focus:border-input-border-focus"
          />
          {error ? <p className="text-sm text-error">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="tertiary" disabled={busy} onClick={() => setEditing(null)}>Cancel</Button>
            <Button size="sm" disabled={busy || !editContent.trim()} onClick={saveEdit}>{busy ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(deleting)} onClose={() => !busy && setDeleting(null)} variant="compact">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-heading">Delete comment?</h2>
          <p className="text-sm text-muted">The comment and its attachment will be permanently deleted.</p>
          {error ? <p className="text-sm text-error">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="tertiary" disabled={busy} onClick={() => setDeleting(null)}>Cancel</Button>
            <Button size="sm" variant="danger" disabled={busy} onClick={confirmDelete}>{busy ? "Deleting..." : "Delete"}</Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
