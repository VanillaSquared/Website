"use client";

import { useEffect, useState } from "react";

import useSecretSequence from "@/hooks/useSecretSequence";

const SECRET_SEQUENCE = "nexosux";
const NEXT_SPLASH_SEQUENCE = "1";
const SPLASH_INTERVAL_MS = 67_000;

function pickRandomSplash(splashTexts, previousSplash = null) {
  if (splashTexts.length < 2) return splashTexts[0] ?? "";

  const choices = splashTexts.filter((splashText) => splashText !== previousSplash);
  return choices[Math.floor(Math.random() * choices.length)];
}

export default function FrontPageSecret({ splashTexts }) {
  const [splashText, setSplashText] = useState(null);

  useSecretSequence({
    sequence: SECRET_SEQUENCE,
    enabled: splashText === null,
    onMatch: () => setSplashText(pickRandomSplash(splashTexts)),
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
  );
}
