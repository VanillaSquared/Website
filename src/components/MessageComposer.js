"use client";

import { useRef, useState } from "react";

import plusIcon from "@/assets/icons/plus.svg";
import Button from "@/components/Button";
import EmojiPicker from "@/components/EmojiPicker";

export default function MessageComposer({ onSubmit, disabled = false, disabledMessage = "", disabledHref = "", placeholder = "Write a comment...", characterLimit = 1000, className = "" }) {
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
    setContent(`${content.slice(0, start)}${emoji}${content.slice(end)}`.slice(0, characterLimit));
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }

  if (disabled) {
    const message = disabledMessage || "Comments are unavailable.";
    const classes = `block w-full rounded-xl border border-locked-input-border bg-locked-input px-4 py-3 text-sm text-locked-text ${className}`;
    return disabledHref ? <a href={disabledHref} className={`${classes} hover:text-soft`}>{message}</a> : <div className={classes} aria-disabled="true">{message}</div>;
  }

  return (
    <form onSubmit={submit} className={`space-y-2 ${className}`}>
      <div className="flex min-h-14 items-center gap-1 rounded-xl border border-message-composer-border bg-input px-2 py-2 transition-colors hover:border-message-composer-border-hover focus-within:border-message-composer-border-hover">
        <Button type="button" variant="iconButton" size="icon" icon={plusIcon} iconClassName="h-6 w-6" className="!h-10 !w-10 shrink-0 !rounded-lg text-muted hover:text-heading" onClick={() => fileRef.current?.click()} disabled={busy} aria-label="Attach a file" />
        <input ref={fileRef} type="file" name="attachment" accept=".log,.png,.txt,.json,.html" className="sr-only" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")} />
        <textarea
          ref={textRef}
          name="content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={placeholder}
          minLength={1}
          maxLength={characterLimit}
          rows={1}
          required
          disabled={busy}
          className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm leading-5 text-heading outline-none placeholder:text-muted disabled:opacity-60"
        />
        <span className="shrink-0 text-xs text-muted">{content.length}/{characterLimit}</span>
        <EmojiPicker onSelect={addEmoji} disabled={busy} />
        <Button type="submit" variant="tertiary" size="sm" className="!h-10 shrink-0" disabled={busy || !content.trim()}>{busy ? "Sending..." : "Send"}</Button>
      </div>
      {fileName ? (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-control px-3 py-2 text-xs text-soft">
          <span className="min-w-0">
            <span className="block truncate">{fileName}</span>
            {fileName.toLowerCase().endsWith(".png") ? <span className="mt-0.5 block text-muted">Use @{fileName} to show this image in your comment.</span> : null}
          </span>
          <button type="button" className="shrink-0 text-muted hover:text-error" onClick={() => { if (fileRef.current) fileRef.current.value = ""; setFileName(""); }}>Remove</button>
        </div>
      ) : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </form>
  );
}
