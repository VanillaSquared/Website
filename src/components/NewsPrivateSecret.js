"use client";

import useSecretSequence from "@/hooks/useSecretSequence";

const SECRET_SEQUENCE = "private";
const PRIVATE_NEWS_COOKIE_NAME = "vsq-news-private";
const RESET_SHORTCUT = "shift+r";

export default function NewsPrivateSecret({ privateUnlocked = false }) {
  useSecretSequence({
    sequence: SECRET_SEQUENCE,
    resetKey: RESET_SHORTCUT,
    onMatch: () => {
      document.cookie = `${PRIVATE_NEWS_COOKIE_NAME}=${privateUnlocked ? "0" : "1"}; Path=/news; SameSite=Lax`;
      window.location.reload();
    },
  });

  return null;
}
