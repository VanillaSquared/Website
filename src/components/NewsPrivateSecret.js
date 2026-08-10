"use client";

import { useRouter } from "next/navigation";

import useSecretSequence from "@/hooks/useSecretSequence";

const SECRET_SEQUENCE = "private";
const PRIVATE_NEWS_COOKIE_NAME = "vsq-news-private";
const RESET_SHORTCUT = "shift+r";

export default function NewsPrivateSecret({ privateUnlocked = false }) {
  const router = useRouter();

  useSecretSequence({
    sequence: SECRET_SEQUENCE,
    resetKey: RESET_SHORTCUT,
    onMatch: () => {
      document.cookie = `${PRIVATE_NEWS_COOKIE_NAME}=${privateUnlocked ? "0" : "1"}; Path=/news; SameSite=Lax`;
      router.refresh();
    },
  });

  return null;
}
