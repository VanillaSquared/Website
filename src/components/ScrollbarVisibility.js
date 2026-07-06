"use client";

import { useEffect } from "react";

const SCROLLBAR_VISIBLE_DURATION_MS = 700;

function getScrolledElement(event) {
  const root = document.documentElement;
  const target = event.target;

  if (target === document || target === window || target === root || target === document.body) {
    return document.scrollingElement ?? root;
  }

  return target instanceof HTMLElement ? target : null;
}

function canElementScroll(element) {
  return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
}

export default function ScrollbarVisibility() {
  useEffect(() => {
    const visibleElements = new Map();

    const showScrollbar = (event) => {
      const element = getScrolledElement(event);

      if (!element || !canElementScroll(element)) {
        return;
      }

      element.classList.add("is-scrolling");

      window.clearTimeout(visibleElements.get(element));
      visibleElements.set(element, window.setTimeout(() => {
        element.classList.remove("is-scrolling");
        visibleElements.delete(element);
      }, SCROLLBAR_VISIBLE_DURATION_MS));
    };

    window.addEventListener("scroll", showScrollbar, true);

    return () => {
      window.removeEventListener("scroll", showScrollbar, true);

      for (const [element, timeout] of visibleElements) {
        window.clearTimeout(timeout);
        element.classList.remove("is-scrolling");
      }

      visibleElements.clear();
    };
  }, []);

  return null;
}
