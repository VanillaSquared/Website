"use client";

import { useEffect } from "react";

export default function LoginInfoCommand() {
  useEffect(() => {
    window.loginInfo = async function loginInfo() {
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
    };

    return () => {
      delete window.loginInfo;
    };
  }, []);

  return null;
}
