"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import settingsIcon from "@/assets/icons/settings.svg";
import Button from "@/components/Button";
import Modal from "@/components/Modal";

export default function HeaderAuthButton({ initialLoggedIn = false }) {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(initialLoggedIn);
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(null);
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
          setUser(data.user ?? null);
          setPermissions(data.permissions ?? null);
        }
      } catch {
        // Keep the server-rendered state if the status check fails.
      }
    }

    updateAuthState();
    function handleAuthChange(event) {
      if (typeof event.detail?.authenticated === "boolean") {
        setLoggedIn(event.detail.authenticated);
        setUser(event.detail.user ?? null);
        setPermissions(event.detail.permissions ?? null);
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
      setUser(null);
      setPermissions(null);
    }
  }, [loggedIn]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    setLoggedIn(false);
    setUser(null);
    setPermissions(null);
    setSettingsOpen(false);
    window.dispatchEvent(new CustomEvent("authchange", { detail: { authenticated: false, user: null, permissions: null } }));
  }

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
          settingsUser={user}
          settingsPermissions={permissions}
          onSettingsLogout={handleLogout}
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
