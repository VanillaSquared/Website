"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import Modal from "@/components/Modal";
import ModrinthDownloadStats from "@/components/ModrinthDownloadStats";
import useSecretSequence from "@/hooks/useSecretSequence";
import { hasCookieConsent, setConsentedCookie } from "@/utils/cookieConsent";

const SECRET_SEQUENCE = "nexosux";
const STATS_SEQUENCE = "stats";
const NEXT_SPLASH_SEQUENCE = "1";
const SPLASH_INTERVAL_MS = 67_000;
const SPLASH_COOKIE = "vsq-splash-secret";
const SPLASH_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const SPLASH_TEXTS_URL = "/cdn/frontpage/super-secret-splash-texts.txt";

let splashTextsPromise;

function loadSplashTexts() {
  if (!splashTextsPromise) {
    splashTextsPromise = fetch(SPLASH_TEXTS_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load splash texts (${response.status})`);
        return response.text();
      })
      .then((content) => content
        .split(/\r?\n/)
        .map((splashText) => splashText.trim())
        .filter(Boolean))
      .catch((error) => {
        splashTextsPromise = undefined;
        throw error;
      });
  }

  return splashTextsPromise;
}

function pickRandomSplashIndex(length, previousIndex) {
  if (length < 2) return length - 1;
  if (previousIndex < 0 || previousIndex >= length) return Math.floor(Math.random() * length);

  const nextIndex = Math.floor(Math.random() * (length - 1));
  return nextIndex >= previousIndex ? nextIndex + 1 : nextIndex;
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

export default function FrontPageSecret({ statsContent = <ModrinthDownloadStats compact /> }) {
  const [splashActive, setSplashActive] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const splashElementRef = useRef(null);
  const splashTextsRef = useRef([]);
  const splashIndexRef = useRef(-1);

  const showNextSplash = useCallback(() => {
    const splashTexts = splashTextsRef.current;
    const nextIndex = pickRandomSplashIndex(splashTexts.length, splashIndexRef.current);
    if (nextIndex < 0 || !splashElementRef.current) return;

    splashIndexRef.current = nextIndex;
    splashElementRef.current.textContent = splashTexts[nextIndex];
  }, []);

  useEffect(() => {
    if (hasCookieConsent() && hasSplashCookie()) setSplashActive(true);
  }, []);

  useEffect(() => {
    if (!splashActive) return undefined;

    let cancelled = false;
    let intervalId;

    loadSplashTexts()
      .then((splashTexts) => {
        if (cancelled) return;
        splashTextsRef.current = splashTexts;
        showNextSplash();
        intervalId = window.setInterval(showNextSplash, SPLASH_INTERVAL_MS);
      })
      .catch(() => {
        if (!cancelled) setSplashActive(false);
      });

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [showNextSplash, splashActive]);

  useSecretSequence({
    sequence: SECRET_SEQUENCE,
    enabled: !splashActive,
    onMatch: () => {
      saveSplashCookie();
      setSplashActive(true);
    },
  });

  useSecretSequence({
    sequence: STATS_SEQUENCE,
    onMatch: () => setStatsOpen(true),
  });

  useSecretSequence({
    sequence: NEXT_SPLASH_SEQUENCE,
    enabled: splashActive,
    onMatch: showNextSplash,
  });

  return (
    <>
      <div className="front-page-secret-title">
        <h1 className="text-5xl font-bold tracking-tight text-heading sm:text-6xl">
          Vanilla²
        </h1>
        {splashActive ? (
          <p ref={splashElementRef} className="front-page-secret-splash" aria-live="polite" />
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
            Stats
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
