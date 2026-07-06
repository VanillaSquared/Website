"use client";

import { useEffect } from "react";

const SCROLLBAR_VISIBLE_DURATION_MS = 700;

export default function ScrollbarVisibility() {
  useEffect(() => {
    const root = document.documentElement;
    let hideTimeout;

    const showScrollbar = () => {
      root.classList.add("is-scrolling");

      window.clearTimeout(hideTimeout);
      hideTimeout = window.setTimeout(() => {
        root.classList.remove("is-scrolling");
      }, SCROLLBAR_VISIBLE_DURATION_MS);
    };

    window.addEventListener("scroll", showScrollbar, true);

    return () => {
      window.removeEventListener("scroll", showScrollbar, true);
      window.clearTimeout(hideTimeout);
      root.classList.remove("is-scrolling");
    };
  }, []);

  return null;
}
