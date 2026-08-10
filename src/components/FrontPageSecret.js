"use client";

import { useEffect, useState } from "react";

import Modal from "@/components/Modal";
import useSecretSequence from "@/hooks/useSecretSequence";
import { hasCookieConsent, setConsentedCookie } from "@/utils/cookieConsent";

const SECRET_SEQUENCE = "nexosux";
const STATS_SEQUENCE = "stats";
const NEXT_SPLASH_SEQUENCE = "1";
const SPLASH_INTERVAL_MS = 67_000;
const SPLASH_COOKIE = "vsq-splash-secret";
const SPLASH_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function pickRandomSplash(splashTexts, previousSplash = null) {
  if (splashTexts.length < 2) return splashTexts[0] ?? "";

  const choices = splashTexts.filter((splashText) => splashText !== previousSplash);
  return choices[Math.floor(Math.random() * choices.length)];
}

function hasSplashCookie() {
  return document.cookie
    .split("; ")
    .some((cookie) => cookie === `${SPLASH_COOKIE}=1`);
}

function saveSplashCookie() {
  setConsentedCookie(
    SPLASH_COOKIE,
    "1",
    `Path=/; Max-Age=${SPLASH_COOKIE_MAX_AGE}; SameSite=Lax`,
  );
}

export default function FrontPageSecret({ splashTexts, statsContent }) {
  const [splashText, setSplashText] = useState(null);
  const [statsOpen, setStatsOpen] = useState(false);

  useEffect(() => {
    if (!hasCookieConsent() || !hasSplashCookie()) return;
    setSplashText(pickRandomSplash(splashTexts));
  }, [splashTexts]);

  useSecretSequence({
    sequence: SECRET_SEQUENCE,
    enabled: splashText === null,
    onMatch: () => {
      saveSplashCookie();
      setSplashText(pickRandomSplash(splashTexts));
    },
  });

  useSecretSequence({
    sequence: STATS_SEQUENCE,
    onMatch: () => setStatsOpen(true),
  });

  useSecretSequence({
    sequence: NEXT_SPLASH_SEQUENCE,
    enabled: splashText !== null,
    onMatch: () => {
      setSplashText((currentSplash) => pickRandomSplash(splashTexts, currentSplash));
    },
  });

  useEffect(() => {
    if (splashText === null) return undefined;

    const interval = window.setInterval(() => {
      setSplashText((currentSplash) => pickRandomSplash(splashTexts, currentSplash));
    }, SPLASH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [splashText === null, splashTexts]);

  return (
    <>
      <div className="front-page-secret-title">
        <h1 className="text-5xl font-bold tracking-tight text-heading sm:text-6xl">
          Vanilla²
        </h1>
        {splashText ? (
          <p className="front-page-secret-splash" aria-live="polite">
            {splashText}
          </p>
        ) : null}
      </div>

      <Modal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        variant="compact"
        ariaLabelledBy="front-page-stats-title"
        className="!min-h-0 !max-w-xs !p-4"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="front-page-stats-title" className="text-base font-semibold text-heading">
            Modrinth Stats
          </h2>
          <button
            type="button"
            onClick={() => setStatsOpen(false)}
            className="rounded-md px-1.5 text-lg leading-none text-muted transition-colors hover:text-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label="Close Modrinth stats"
          >
            ×
          </button>
        </div>
        <div className="mt-2">
          {statsContent}
        </div>
      </Modal>
    </>
  );
}
