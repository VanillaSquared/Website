"use client";

import { useEffect, useState } from "react";

import moonIcon from "@/assets/icons/moon.svg";
import sunIcon from "@/assets/icons/sun.svg";
import Toggle from "@/components/Toggle";
import { setConsentedCookie } from "@/utils/cookieConsent";

const THEME_COOKIE_NAME = "vsq-theme";
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    setIsLight(document.documentElement.dataset.theme === "light");
  }, []);

  function setTheme(nextIsLight) {
    if (nextIsLight) {
      document.documentElement.dataset.theme = "light";
    } else {
      delete document.documentElement.dataset.theme;
    }

    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    setConsentedCookie(
      THEME_COOKIE_NAME,
      nextIsLight ? "light" : "dark",
      `Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax${secure}`
    );
    setIsLight(nextIsLight);
  }

  return (
    <Toggle
      variant="compact"
      checked={isLight}
      checkedIcon={sunIcon}
      uncheckedIcon={moonIcon}
      onChange={setTheme}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
      className="ml-auto shrink-0"
    />
  );
}
