"use client";

import { useEffect, useRef, useState } from "react";

import emojiIcon from "@/assets/icons/emoji.svg";

const DEFAULT_EMOJIS = ["😀", "😂", "😊", "😍", "🤔", "😎", "😭", "😡", "👍", "👎", "❤️", "🎉", "🔥", "✨", "✅", "🐛", "💻", "🎮", "🧱", "🚀"];

export default function EmojiPicker({ onSelect, emojis = DEFAULT_EMOJIS, disabled = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function close(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        aria-label="Choose an emoji"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-control-hover hover:text-heading disabled:opacity-50"
      >
        <span className="h-5 w-5 bg-current" style={{ WebkitMask: `url(${emojiIcon.src}) center / contain no-repeat`, mask: `url(${emojiIcon.src}) center / contain no-repeat` }} />
      </button>
      {open ? (
        <div className="absolute bottom-full right-0 z-30 mb-2 w-64 rounded-xl border border-control-border bg-control-panel p-3 shadow-xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Emoji</p>
          <div className="grid grid-cols-5 gap-1">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition-colors hover:bg-control-hover"
                onClick={() => { onSelect?.(emoji); setOpen(false); }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
