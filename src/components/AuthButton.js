"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import settingsIcon from "@/assets/icons/settings.svg";
import Button from "@/components/Button";
import Modal from "@/components/Modal";

export default function HeaderAuthButton({ initialLoggedIn = false }) {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(initialLoggedIn);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function updateAuthState() {
      try {
        const response = await fetch("/api/auth/status", {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const authenticated = Boolean(data.authenticated);

        if (!cancelled) {
          setLoggedIn(authenticated);
        }
      } catch {
        // Keep the server-rendered state if the status check fails.
      }
    }

    updateAuthState();
    function handleAuthChange(event) {
      if (typeof event.detail?.authenticated === "boolean") {
        setLoggedIn(event.detail.authenticated);
        return;
      }

      updateAuthState();
    }

    window.addEventListener("focus", updateAuthState);
    window.addEventListener("pageshow", updateAuthState);
    window.addEventListener("authchange", handleAuthChange);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", updateAuthState);
      window.removeEventListener("pageshow", updateAuthState);
      window.removeEventListener("authchange", handleAuthChange);
    };
  }, [pathname]);

  useEffect(() => {
    if (!loggedIn) {
      setSettingsOpen(false);
    }
  }, [loggedIn]);

  if (loggedIn) {
    return (
      <>
        <Button
          size="icon"
          variant="tertiary"
          icon={settingsIcon}
          aria-label="Settings"
          aria-haspopup="dialog"
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen((open) => !open)}
        />
        <Modal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          variant="settings"
          blurBackground
        />
      </>
    );
  }

  return (
    <Button href="/login" variant="tertiary" size="sm" className="h-9 min-w-20 shrink-0 px-4">
      Login
    </Button>
  );
}
