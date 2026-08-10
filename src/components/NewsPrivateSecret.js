"use client";

import { useRouter } from "next/navigation";

import useSecretSequence from "@/hooks/useSecretSequence";

const SECRET_SEQUENCE = "private";
const PRIVATE_NEWS_COOKIE = "vsq-news-private=1; Path=/news; SameSite=Lax";
const RESET_SHORTCUT = "shift+r";

export default function NewsPrivateSecret({ enabled = true }) {
  const router = useRouter();

  useSecretSequence({
    sequence: SECRET_SEQUENCE,
    resetKey: RESET_SHORTCUT,
    enabled,
    onMatch: () => {
      document.cookie = PRIVATE_NEWS_COOKIE;
      router.refresh();
    },
  });

  return null;
}
