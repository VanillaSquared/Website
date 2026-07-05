"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import settingsIcon from "@/assets/icons/settings.svg";
import closeIcon from "@/assets/icons/x.svg";
import Button from "@/components/Button";
import Modal from "@/components/Modal";

const settingsSections = [
  {
    label: "Account",
    items: ["Profile", "Account", "Security", "Sessions"],
  },
  {
    label: "Experience",
    items: ["Appearance", "Accessibility", "Notifications", "Language & Time"],
  },
  {
    label: "VanillaSquared",
    items: ["Minecraft Account", "Developer Apps", "Privacy", "Support"],
  },
];

function getInitials(username, email) {
  const displayName = username || email || "VS";

  return displayName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "VS";
}

function maskEmail(email) {
  if (!email || !email.includes("@")) {
    return "No email available";
  }

  const [name, domain] = email.split("@");
  const visible = name.slice(0, 2);

  return `${visible}${"*".repeat(Math.max(3, name.length - 2))}@${domain}`;
}

function SettingsContent({ user, onClose, onLogout }) {
  const username = user?.username || "VanillaSquared User";
  const email = user?.email || "";

  return (
    <div className="flex h-full min-h-0 flex-col bg-modal text-soft md:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-divider bg-card/50 p-5 md:w-72 md:border-b-0 md:border-r">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/50 bg-accent/20 text-lg font-bold text-heading">
            {getInitials(username, email)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-heading">{username}</p>
            <p className="truncate text-sm text-muted">{email || "Manage your account"}</p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-search-border bg-search px-3 py-2 text-sm text-muted">
          Search settings
        </div>

        <nav className="mt-5 min-h-0 space-y-5 overflow-y-auto pr-1">
          {settingsSections.map((section) => (
            <div key={section.label}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtle">{section.label}</p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${item === "Account" ? "bg-button-tertiary-hover text-heading" : "text-muted hover:bg-button-tertiary hover:text-soft"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-divider px-6">
          <h2 className="text-xl font-semibold text-heading">Account</h2>
          <Button size="icon" variant="tertiary" icon={closeIcon} aria-label="Close settings" onClick={onClose} />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8 md:px-12">
          <div className="mx-auto max-w-3xl space-y-10">
            <section>
              <h3 className="text-2xl font-semibold text-heading">Account Info</h3>
              <div className="mt-6 divide-y divide-divider rounded-2xl border border-divider bg-card/40">
                {[
                  ["Username", username],
                  ["Email", maskEmail(email)],
                  ["User ID", user?.id || "Unavailable"],
                ].map(([label, value]) => (
                  <div key={label} className="grid gap-3 px-5 py-4 sm:grid-cols-[180px_1fr_auto] sm:items-center">
                    <p className="font-semibold text-heading">{label}</p>
                    <p className="break-all text-muted sm:text-right">{value}</p>
                    <Button size="sm" variant="tertiary">Edit</Button>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-heading">Password & Security</h3>
              <div className="mt-6 divide-y divide-divider rounded-2xl border border-divider bg-card/40">
                {["Password", "Two-Factor Authentication", "Logged-in Devices"].map((item) => (
                  <div key={item} className="flex items-center justify-between gap-4 px-5 py-4">
                    <p className="font-semibold text-heading">{item}</p>
                    <Button size="sm" variant="tertiary">Manage</Button>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-divider bg-card/40 p-5">
              <h3 className="text-2xl font-semibold text-heading">Account Actions</h3>
              <p className="mt-2 text-sm text-muted">Sign out of this browser session.</p>
              <Button className="mt-5" variant="secondary" onClick={onLogout}>Logout</Button>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function HeaderAuthButton({ initialLoggedIn = false }) {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(initialLoggedIn);
  const [user, setUser] = useState(null);
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
    }
  }, [loggedIn]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    setLoggedIn(false);
    setUser(null);
    setSettingsOpen(false);
    window.dispatchEvent(new CustomEvent("authchange", { detail: { authenticated: false, user: null } }));
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
        >
          <SettingsContent user={user} onClose={() => setSettingsOpen(false)} onLogout={handleLogout} />
        </Modal>
      </>
    );
  }

  return (
    <Button href="/login" variant="tertiary" size="sm" className="h-9 min-w-20 shrink-0 px-4">
      Login
    </Button>
  );
}
