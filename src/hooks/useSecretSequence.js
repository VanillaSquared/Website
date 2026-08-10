"use client";

import { useEffect, useRef } from "react";

function isEditableTarget(target) {
  return target instanceof HTMLElement
    && (target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName));
}

function isResetShortcut(event, resetKey) {
  const parts = resetKey.toLowerCase().split("+");
  const key = parts.at(-1);
  const modifiers = new Set(parts.slice(0, -1));

  return event.key.toLowerCase() === key
    && event.shiftKey === modifiers.has("shift")
    && event.ctrlKey === modifiers.has("ctrl")
    && event.altKey === modifiers.has("alt")
    && event.metaKey === modifiers.has("meta");
}

export default function useSecretSequence({ sequence, onMatch, enabled = true, resetKey = "r" }) {
  const typedSequence = useRef("");
  const onMatchRef = useRef(onMatch);

  useEffect(() => {
    onMatchRef.current = onMatch;
  }, [onMatch]);

  useEffect(() => {
    if (!enabled) {
      typedSequence.current = "";
      return undefined;
    }

    function handleKeyDown(event) {
      if (isEditableTarget(event.target)) return;

      if (isResetShortcut(event, resetKey)) {
        typedSequence.current = "";
        return;
      }

      if (
        event.ctrlKey
        || event.altKey
        || event.metaKey
        || event.key.length !== 1
      ) return;

      const key = event.key.toLowerCase();
      typedSequence.current += key;
      if (typedSequence.current === sequence.toLowerCase()) {
        typedSequence.current = "";
        onMatchRef.current();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, resetKey, sequence]);
}
