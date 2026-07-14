"use client";

import { useState } from "react";

import Button from "@/components/Button";
import FileUpload from "@/components/FileUpload";

export default function MessageComposer({ onSubmit, disabled = false, disabledMessage = "", placeholder = "Write a comment..." }) {
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resetKey, setResetKey] = useState(0);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const formData = new FormData(event.currentTarget);
      await onSubmit(formData);
      setContent("");
      setResetKey((value) => value + 1);
    } catch (cause) {
      setError(cause.message || "Could not send comment.");
    } finally {
      setBusy(false);
    }
  }

  if (disabled) return disabledMessage ? <p className="text-sm text-muted">{disabledMessage}</p> : null;

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="sr-only">Comment</span>
        <textarea
          name="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={placeholder}
          minLength={1}
          maxLength={4000}
          rows={3}
          required
          disabled={busy}
          className="w-full resize-y rounded-xl border border-input-border bg-input px-3 py-2 text-sm text-heading outline-none transition-colors placeholder:text-muted hover:border-input-border-hover focus:border-input-border-focus disabled:opacity-60"
        />
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <FileUpload
          key={resetKey}
          className="min-w-0 flex-1"
          label="Optional attachment"
          description="Drop or choose one file"
          name="attachment"
          accept=".log,.png,.txt,.json,.html"
          maxFiles={1}
          maxFileSize={10 * 1024 * 1024}
          compact
          showBrowseButton={false}
        />
        <Button type="submit" size="sm" disabled={busy || !content.trim()}>{busy ? "Sending..." : "Send"}</Button>
      </div>
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </form>
  );
}
