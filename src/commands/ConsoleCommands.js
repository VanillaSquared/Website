"use client";

import { useEffect } from "react";

async function sessionInfo() {
  const response = await fetch("/api/auth/status?includeTokens=1", {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(`Could not load login information (${response.status})`);
  }

  const info = await response.json();
  const user = info.user ?? {};

  console.group("Login info");
  console.log("Logged in:", info.authenticated);
  console.log("Username:", user.username ?? null);
  console.log("UUID:", user.uuid ?? user.id ?? null);
  console.log("Email:", user.email ?? null);
  console.log("Tokens:", info.tokens ?? null);
  console.groupEnd();

  return info;
}

async function logout() {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    cache: "no-store",
    credentials: "same-origin",
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error ?? `Could not log out (${response.status})`);
  }

  window.dispatchEvent(new CustomEvent("authchange", {
    detail: { authenticated: false },
  }));
  console.log("Logged out.");

  return result;
}

const commands = {
  sessionInfo,
  logout,
};

export default function ConsoleCommands() {
  useEffect(() => {
    Object.assign(window, commands);

    return () => {
      for (const commandName of Object.keys(commands)) {
        delete window[commandName];
      }
    };
  }, []);

  return null;
}
