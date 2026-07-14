"use client";

import { useState } from "react";

import Button from "@/components/Button";
import MessageComposer from "@/components/MessageComposer";
import Modal from "@/components/Modal";
import ThreadRow from "@/components/ThreadRow";
import useDeveloperMode from "@/hooks/useDeveloperMode";

async function requestJson(path, options) {
  const response = await fetch(path, { credentials: "same-origin", cache: "no-store", ...options });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Request failed.");
  return result;
}

export default function CommentThread({ publicId, initialComments = [], currentUserId = null, canWrite = false, canManage = false, allowComments = true, interactionLocked = false, commentCharacterLimit = 1000, bypassCharacterLimit = false }) {
  const [comments, setComments] = useState(initialComments);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [developerMode] = useDeveloperMode();
  const basePath = `/api/bugs/${encodeURIComponent(publicId)}/comments`;

  async function create(formData) {
    const result = await requestJson(basePath, { method: "POST", body: formData });
    setComments((items) => [...items, result.comment]);
  }

  async function react(comment, emoji) {
    setError("");
    try {
      const result = await requestJson(`${basePath}/${encodeURIComponent(comment.id)}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      setComments((items) => items.map((item) => item.id === comment.id ? { ...item, reactions: result.reactions } : item));
    } catch (cause) {
      setError(cause.message);
    }
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
      <div className="mt-2">
        {comments.map((comment, index) => {
          const previous = comments[index - 1];
          const grouped = Boolean(
            previous?.creatorUserId
            && previous.creatorUserId === comment.creatorUserId
            && !previous.reactions?.length
            && !comment.reactions?.length
          );
          return (
            <ThreadRow
              key={comment.id}
              message={comment}
              grouped={grouped}
              canCopyId={developerMode}
              canChange={!interactionLocked && (canManage || Boolean(currentUserId && comment.creatorUserId === currentUserId))}
              canReact={Boolean(!interactionLocked && allowComments && canWrite && currentUserId)}
              editing={editing?.id === comment.id}
              editContent={editContent}
              editError={editing?.id === comment.id ? error : ""}
              editBusy={busy}
              editCharacterLimit={bypassCharacterLimit ? 100000 : commentCharacterLimit}
              onEditContentChange={setEditContent}
              onSaveEdit={saveEdit}
              onCancelEdit={() => { if (!busy) { setEditing(null); setError(""); } }}
              onReact={(emoji) => react(comment, emoji)}
              onEdit={() => openEdit(comment)}
              onDelete={() => { setDeleting(comment); setError(""); }}
              attachmentHref={(message) => `${basePath}/${encodeURIComponent(message.id)}/attachment/${encodeURIComponent(message.attachment.id)}`}
            />
          );
        })}
      </div>
      {!comments.length && allowComments ? <p className="py-4 text-sm italic text-muted">No comments yet.</p> : null}
      {error && !editing && !deleting ? <p className="mb-3 text-sm text-error">{error}</p> : null}
      <MessageComposer
        className={comments.length ? "mt-6" : ""}
        onSubmit={create}
        disabled={!allowComments || !canWrite || interactionLocked}
        disabledMessage={interactionLocked ? "The bug panel is currently in lockdown." : (!allowComments ? "Comments are disabled for this bug report." : (currentUserId ? "You do not have permission to comment." : "Log in to comment."))}
        disabledHref={!interactionLocked && allowComments && !currentUserId ? `/login?returnTo=${encodeURIComponent(`/bugs/${publicId}`)}` : ""}
        characterLimit={bypassCharacterLimit ? 100000 : commentCharacterLimit}
      />


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
