"use client";

import { useEffect, useRef, useState } from "react";

import emojiIcon from "@/assets/icons/emoji.svg";
import SearchBar from "@/components/SearchBar";

const DEFAULT_EMOJIS = [
  { emoji: "😀", name: "grinning happy" }, { emoji: "😂", name: "laughing tears" }, { emoji: "😊", name: "smiling blush" },
  { emoji: "😍", name: "heart eyes love" }, { emoji: "🤔", name: "thinking" }, { emoji: "😎", name: "cool sunglasses" },
  { emoji: "😭", name: "crying sad" }, { emoji: "😡", name: "angry" }, { emoji: "👍", name: "thumbs up yes" },
  { emoji: "👎", name: "thumbs down no" }, { emoji: "❤️", name: "heart love" }, { emoji: "🎉", name: "party celebrate" },
  { emoji: "🔥", name: "fire" }, { emoji: "✨", name: "sparkles" }, { emoji: "✅", name: "check done" },
  { emoji: "🐛", name: "bug" }, { emoji: "💻", name: "computer" }, { emoji: "🎮", name: "game" },
  { emoji: "🧱", name: "brick" }, { emoji: "🚀", name: "rocket" },
];

export default function EmojiPicker({ onSelect, emojis = DEFAULT_EMOJIS, disabled = false, buttonClassName = "", iconClassName = "h-6 w-6" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const items = emojis.map((item) => typeof item === "string" ? { emoji: item, name: item } : item);
  const filteredEmojis = items.filter((item) => `${item.emoji} ${item.name}`.toLowerCase().includes(query.trim().toLowerCase()));

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
        className={`flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-control-hover hover:text-heading disabled:opacity-50 ${buttonClassName}`}
      >
        <span className={`${iconClassName} bg-current`} style={{ WebkitMask: `url(${emojiIcon.src}) center / contain no-repeat`, mask: `url(${emojiIcon.src}) center / contain no-repeat` }} />
      </button>
      {open ? (
        <div className="absolute bottom-full right-0 z-30 mb-2 w-64 rounded-xl border border-control-border bg-control-panel p-3 shadow-xl">
          <SearchBar className="mb-2 !max-w-none" value={query} onChange={setQuery} showPreview={false} placeholder="Search emoji" label="Search emoji" />
          <div className="grid max-h-48 grid-cols-5 gap-1 overflow-y-auto">
            {filteredEmojis.map(({ emoji }) => (
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
