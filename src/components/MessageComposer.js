"use client";

import { useRef, useState } from "react";

import plusIcon from "@/assets/icons/plus.svg";
import Button from "@/components/Button";
import EmojiPicker from "@/components/EmojiPicker";

export default function MessageComposer({ onSubmit, disabled = false, disabledMessage = "", disabledHref = "", placeholder = "Write a comment..." }) {
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const textRef = useRef(null);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const form = event.currentTarget;
      await onSubmit(new FormData(form));
      setContent("");
      setFileName("");
      form.reset();
    } catch (cause) {
      setError(cause.message || "Could not send comment.");
    } finally {
      setBusy(false);
    }
  }

  function addEmoji(emoji) {
    const textarea = textRef.current;
    const start = textarea?.selectionStart ?? content.length;
    const end = textarea?.selectionEnd ?? content.length;
    setContent(`${content.slice(0, start)}${emoji}${content.slice(end)}`);
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }

  if (disabled) {
    const message = disabledMessage || "Comments are unavailable.";
    const classes = "block w-full rounded-xl border border-locked-input-border bg-locked-input px-4 py-3 text-sm text-locked-text";
    return disabledHref ? <a href={disabledHref} className={`${classes} hover:text-soft`}>{message}</a> : <div className={classes} aria-disabled="true">{message}</div>;
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex min-h-14 items-end gap-1 rounded-xl bg-input px-2 py-2 focus-within:ring-1 focus-within:ring-input-border-focus">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-input transition-colors hover:bg-soft disabled:opacity-50"
          aria-label="Attach a file"
        >
          <span className="h-4 w-4 bg-current" style={{ WebkitMask: `url(${plusIcon.src}) center / contain no-repeat`, mask: `url(${plusIcon.src}) center / contain no-repeat` }} />
        </button>
        <input ref={fileRef} type="file" name="attachment" accept=".log,.png,.txt,.json,.html" className="sr-only" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")} />
        <textarea
          ref={textRef}
          name="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={placeholder}
          minLength={1}
          maxLength={4000}
          rows={1}
          required
          disabled={busy}
          className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 text-heading outline-none placeholder:text-muted disabled:opacity-60"
        />
        <EmojiPicker onSelect={addEmoji} disabled={busy} />
        <Button type="submit" size="sm" className="mb-0.5 shrink-0" disabled={busy || !content.trim()}>{busy ? "Sending..." : "Send"}</Button>
      </div>
      {fileName ? (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-control px-3 py-2 text-xs text-soft">
          <span className="truncate">{fileName}</span>
          <button type="button" className="text-muted hover:text-error" onClick={() => { if (fileRef.current) fileRef.current.value = ""; setFileName(""); }}>Remove</button>
        </div>
      ) : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </form>
  );
}
