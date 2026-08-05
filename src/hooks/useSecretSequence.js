"use client";

import { useEffect, useRef } from "react";

function isEditableTarget(target) {
  return target instanceof HTMLElement
    && (target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName));
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
      if (
        event.ctrlKey
        || event.altKey
        || event.metaKey
        || event.key.length !== 1
        || isEditableTarget(event.target)
      ) return;

      const key = event.key.toLowerCase();
      if (key === resetKey.toLowerCase()) {
        typedSequence.current = "";
        return;
      }

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
